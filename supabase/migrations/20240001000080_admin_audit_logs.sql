-- ==============================================================================
-- Migration 080: Admin Audit Logs & Governance Tracking
-- RFC 016 Kluster E: Tata Kelola & Keamanan Admin
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for fast filtering & temporal queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor ON public.admin_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admin roles can view audit logs
DROP POLICY IF EXISTS "admin_audit_logs_select" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_logs_select"
    ON public.admin_audit_logs
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Revoke direct DML from public & authenticated users
REVOKE INSERT, UPDATE, DELETE ON public.admin_audit_logs FROM anon, authenticated;

-- Helper function to record admin audit logs safely
CREATE OR REPLACE FUNCTION public.record_admin_audit_log(
    p_action TEXT,
    p_target_type TEXT,
    p_target_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_actor_email TEXT;
    v_actor_role TEXT;
    v_log_id UUID;
BEGIN
    v_actor_id := auth.uid();
    
    -- Verify actor has admin or staff privileges
    IF NOT (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = v_actor_id
            AND ur.role IN ('support_agent', 'clinical_reviewer')
        )
    ) THEN
        RAISE EXCEPTION 'Akses ditolak: hanya staf terotentikasi yang berhak mencatat audit log';
    END IF;

    -- Lookup actor email
    SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_id;

    -- Lookup primary role
    SELECT role INTO v_actor_role FROM public.user_roles WHERE user_id = v_actor_id LIMIT 1;
    IF v_actor_role IS NULL THEN
        v_actor_role := 'staff';
    END IF;

    INSERT INTO public.admin_audit_logs (
        actor_id,
        actor_email,
        actor_role,
        action,
        target_type,
        target_id,
        details
    ) VALUES (
        v_actor_id,
        v_actor_email,
        v_actor_role,
        p_action,
        p_target_type,
        p_target_id,
        p_details
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- Integrasikan audit log otomatis ke admin_set_user_role
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_target_user_id uuid,
  p_role           text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_old_role text;
BEGIN
  -- Hanya Super Admin, Tech Lead, atau Admin lama yang berhak mengubah role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'tech_lead', 'admin')
  ) THEN
    RAISE EXCEPTION 'Akses ditolak: hanya Super Admin atau Tech Lead yang dapat mengelola hak akses role';
  END IF;

  SELECT role INTO v_old_role FROM public.user_roles WHERE user_id = p_target_user_id LIMIT 1;

  IF p_role = 'customer' OR p_role IS NULL OR p_role = '' THEN
    -- Cegah admin mencabut role miliknya sendiri untuk mencegah lockout
    IF p_target_user_id = auth.uid() THEN
      RAISE EXCEPTION 'Tidak dapat mencabut hak akses akun Anda sendiri';
    END IF;

    DELETE FROM public.user_roles
    WHERE user_id = p_target_user_id;

    -- Rekam audit log
    PERFORM public.record_admin_audit_log(
      'REVOKE_ROLE',
      'user_roles',
      p_target_user_id::text,
      jsonb_build_object('previous_role', v_old_role, 'new_role', 'customer')
    );

    RETURN true;
  ELSIF p_role IN ('admin', 'super_admin', 'tech_lead', 'business_lead', 'support_agent', 'clinical_reviewer') THEN
    DELETE FROM public.user_roles
    WHERE user_id = p_target_user_id;

    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (p_target_user_id, p_role, auth.uid());

    -- Rekam audit log
    PERFORM public.record_admin_audit_log(
      'ASSIGN_ROLE',
      'user_roles',
      p_target_user_id::text,
      jsonb_build_object('previous_role', v_old_role, 'new_role', p_role)
    );

    RETURN true;
  ELSE
    RAISE EXCEPTION 'Role tidak dikenali: %', p_role;
  END IF;
END;
$$;

-- Integrasikan audit log otomatis ke admin_adjust_user_coins
CREATE OR REPLACE FUNCTION public.admin_adjust_user_coins(
  p_target_user_id uuid,
  p_amount         integer,
  p_reason         text DEFAULT 'Admin Adjustment'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_new_balance integer;
  v_caller_authorized boolean;
  v_old_balance integer;
BEGIN
  -- 1. Cek otorisasi pemanggil
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'tech_lead', 'business_lead', 'support_agent')
  ) INTO v_caller_authorized;

  IF NOT v_caller_authorized THEN
    v_caller_authorized := public.is_admin();
  END IF;

  IF NOT v_caller_authorized THEN
    RAISE EXCEPTION 'Akses ditolak: hanya staf terotorisasi yang dapat menyesuaikan koin';
  END IF;

  -- 2. Ambil saldo awal
  SELECT balance INTO v_old_balance
  FROM public.coin_balances
  WHERE user_id = p_target_user_id;

  IF v_old_balance IS NULL THEN
    v_old_balance := 0;
  END IF;

  -- 3. Upsert saldo koin
  INSERT INTO public.coin_balances (user_id, balance, updated_at)
  VALUES (p_target_user_id, GREATEST(0, p_amount), now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = GREATEST(0, public.coin_balances.balance + p_amount),
    updated_at = now()
  RETURNING balance INTO v_new_balance;

  -- 4. Catat transaksi koin
  INSERT INTO public.coin_transactions (
    user_id,
    amount,
    type,
    description,
    balance_after
  ) VALUES (
    p_target_user_id,
    p_amount,
    CASE WHEN p_amount >= 0 THEN 'bonus'::public.coin_tx_type ELSE 'spend'::public.coin_tx_type END,
    p_reason,
    v_new_balance
  );

  -- 5. Rekam audit log
  PERFORM public.record_admin_audit_log(
    'ADJUST_CREDITS',
    'coin_balances',
    p_target_user_id::text,
    jsonb_build_object('amount', p_amount, 'reason', p_reason, 'previous_balance', v_old_balance, 'new_balance', v_new_balance)
  );

  RETURN v_new_balance;
END;
$$;
