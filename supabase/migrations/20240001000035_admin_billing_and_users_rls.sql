-- ============================================================
-- Migration 035: Admin RLS for Billing & Users Management
-- Memberikan akses penuh baca (dan kelola) untuk Admin pada:
-- 1. tripay_invoices (SELECT)
-- 2. profiles (SELECT, UPDATE)
-- 3. subscriptions (SELECT)
-- 4. coin_balances (SELECT)
-- 5. coin_transactions (SELECT)
-- 6. user_roles (SELECT untuk admin)
-- 7. RPC admin_adjust_user_coins (koreksi saldo koin dengan audit log)
-- 8. RPC admin_set_user_role (kelola role admin/user)
-- ============================================================

-- ---- 1. tripay_invoices ----
DROP POLICY IF EXISTS "tripay_invoices_admin_select" ON public.tripay_invoices;
CREATE POLICY "tripay_invoices_admin_select" ON public.tripay_invoices
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ---- 2. profiles ----
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
CREATE POLICY "profiles_admin_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- 3. subscriptions ----
DROP POLICY IF EXISTS "subscriptions_admin_select" ON public.subscriptions;
CREATE POLICY "subscriptions_admin_select" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ---- 4. coin_balances ----
DROP POLICY IF EXISTS "coin_balances_admin_select" ON public.coin_balances;
CREATE POLICY "coin_balances_admin_select" ON public.coin_balances
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ---- 5. coin_transactions ----
DROP POLICY IF EXISTS "coin_transactions_admin_select" ON public.coin_transactions;
CREATE POLICY "coin_transactions_admin_select" ON public.coin_transactions
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ---- 6. user_roles ----
DROP POLICY IF EXISTS "user_roles_admin_select" ON public.user_roles;
CREATE POLICY "user_roles_admin_select" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ---- 7. RPC: admin_adjust_user_coins ----
CREATE OR REPLACE FUNCTION public.admin_adjust_user_coins(
  p_target_user_id uuid,
  p_amount         integer,
  p_reason         text DEFAULT 'Admin Adjustment'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  -- Hanya admin yang berhak mengeksekusi
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: hanya admin yang dapat mengubah saldo koin';
  END IF;

  -- Pastikan target user valid
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target_user_id) THEN
    RAISE EXCEPTION 'User tidak ditemukan';
  END IF;

  -- Update atau insert saldo koin
  INSERT INTO public.coin_balances (user_id, balance, updated_at)
  VALUES (p_target_user_id, GREATEST(0, p_amount), now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = GREATEST(0, public.coin_balances.balance + p_amount),
    updated_at = now()
  RETURNING balance INTO v_new_balance;

  -- Catat ke riwayat transaksi koin untuk transparansi dan audit
  INSERT INTO public.coin_transactions (
    user_id,
    amount,
    type,
    notes,
    created_at
  )
  VALUES (
    p_target_user_id,
    p_amount,
    'admin_adjustment',
    COALESCE(p_reason, 'Admin Adjustment'),
    now()
  );

  RETURN v_new_balance;
END;
$$;

-- ---- 8. RPC: admin_set_user_role ----
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_target_user_id uuid,
  p_role           text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hanya admin yang berhak mengubah role
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: hanya admin yang dapat mengelola role';
  END IF;

  IF p_role = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (p_target_user_id, 'admin', auth.uid())
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN true;
  ELSIF p_role = 'customer' OR p_role IS NULL OR p_role = '' THEN
    -- Jangan biarkan admin mencabut role miliknya sendiri untuk mencegah lockout
    IF p_target_user_id = auth.uid() THEN
      RAISE EXCEPTION 'Tidak dapat mencabut hak admin akun Anda sendiri';
    END IF;

    DELETE FROM public.user_roles
    WHERE user_id = p_target_user_id AND role = 'admin';
    RETURN true;
  ELSE
    RAISE EXCEPTION 'Role tidak dikenali: %', p_role;
  END IF;
END;
$$;
