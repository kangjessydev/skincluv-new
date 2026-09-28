-- ============================================================
-- Migration 073: Multi-Role RBAC Foundation & CS-Safe RPC (RFC 015)
-- 1. Memperluas role check constraint di public.user_roles
-- 2. Memperbarui public.is_admin() (backward compatible)
-- 3. Menambahkan public.has_role(text) dan public.get_my_roles()
-- 4. Memperbarui public.admin_set_user_role(uuid, text)
-- 5. Memperbarui public.admin_adjust_user_coins agar support_agent diizinkan
-- 6. Menambahkan public.cs_get_customer_summary(uuid) (Invarian 16)
-- ============================================================

-- 1. Perluas role check constraint di public.user_roles
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('admin', 'super_admin', 'tech_lead', 'business_lead', 'support_agent', 'clinical_reviewer'));

-- 2. Memperbarui public.is_admin() (Kompatibel dengan semua tabel admin yang sudah ada)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'tech_lead', 'business_lead')
  );
$$;

-- 3. Helper: has_role(p_role text)
CREATE OR REPLACE FUNCTION public.has_role(p_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND (
      role = p_role
      OR (p_role != 'super_admin' AND role IN ('super_admin', 'admin'))
    )
  );
$$;

-- 4. Helper: get_my_roles()
CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(role), ARRAY[]::text[])
  FROM public.user_roles
  WHERE user_id = auth.uid();
$$;

-- 5. Memperbarui public.admin_set_user_role
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
  -- Hanya Super Admin, Tech Lead, atau Admin lama yang berhak mengubah role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'tech_lead', 'admin')
  ) THEN
    RAISE EXCEPTION 'Akses ditolak: hanya Super Admin atau Tech Lead yang dapat mengelola hak akses role';
  END IF;

  IF p_role = 'customer' OR p_role IS NULL OR p_role = '' THEN
    -- Cegah admin mencabut role miliknya sendiri untuk mencegah lockout
    IF p_target_user_id = auth.uid() THEN
      RAISE EXCEPTION 'Tidak dapat mencabut hak akses akun Anda sendiri';
    END IF;

    DELETE FROM public.user_roles
    WHERE user_id = p_target_user_id;
    RETURN true;
  ELSIF p_role IN ('admin', 'super_admin', 'tech_lead', 'business_lead', 'support_agent', 'clinical_reviewer') THEN
    DELETE FROM public.user_roles
    WHERE user_id = p_target_user_id;

    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (p_target_user_id, p_role, auth.uid());
    RETURN true;
  ELSE
    RAISE EXCEPTION 'Role tidak dikenali: %', p_role;
  END IF;
END;
$$;

-- 6. Memperbarui public.admin_adjust_user_coins agar support_agent diizinkan
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
  v_caller_authorized boolean;
BEGIN
  -- Otorisasi: Admin atau Support Agent
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'tech_lead', 'business_lead', 'support_agent')
  ) INTO v_caller_authorized;

  IF NOT v_caller_authorized THEN
    RAISE EXCEPTION 'Akses ditolak: tidak memiliki wewenang untuk mengubah saldo koin';
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

-- 7. CS-Safe RPC: cs_get_customer_summary (Invarian 16 UU PDP No. 27/2022)
-- Mengembalikan profil dasar, status langganan, koin, invoice, dan ringkasan kuota.
-- DILARANG MENGEMBALIKAN: Foto wajah, diagnosis klinis, riwayat chat, atau storage URL.
CREATE OR REPLACE FUNCTION public.cs_get_customer_summary(
  p_target_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_authorized boolean;
  v_profile record;
  v_subscription record;
  v_coin_balance integer;
  v_invoices jsonb;
  v_coin_transactions jsonb;
  v_quota_summary jsonb;
  v_result jsonb;
BEGIN
  -- 1. Otorisasi: Hanya admin atau support_agent
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'tech_lead', 'business_lead', 'support_agent')
  ) INTO v_caller_authorized;

  IF NOT v_caller_authorized THEN
    RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki wewenang Customer Support';
  END IF;

  -- 2. Ambil profil dasar (NON-BIOMETRIK, NON-KLINIS)
  SELECT id, full_name, username, created_at
  INTO v_profile
  FROM public.profiles
  WHERE id = p_target_user_id;

  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'Pengguna tidak ditemukan';
  END IF;

  -- 3. Ambil data langganan
  SELECT s.status, s.started_at, s.expires_at, t.name as tier_name, t.slug as tier_slug
  INTO v_subscription
  FROM public.subscriptions s
  LEFT JOIN public.subscription_tiers t ON s.tier_id = t.id
  WHERE s.user_id = p_target_user_id AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- 4. Ambil saldo koin
  SELECT COALESCE(balance, 0)
  INTO v_coin_balance
  FROM public.coin_balances
  WHERE user_id = p_target_user_id;

  -- 5. Ambil riwayat invoice Tripay terbaru (maks 10)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'tripay_reference', tripay_reference,
        'plan', plan,
        'amount_idr', amount_idr,
        'status', status,
        'payment_method', payment_method,
        'created_at', created_at
      ) ORDER BY created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_invoices
  FROM (
    SELECT tripay_reference, plan, amount_idr, status, payment_method, created_at
    FROM public.tripay_invoices
    WHERE user_id = p_target_user_id
    ORDER BY created_at DESC
    LIMIT 10
  ) inv;

  -- 6. Ambil riwayat koin terbaru (maks 10)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'amount', amount,
        'type', type,
        'notes', notes,
        'created_at', created_at
      ) ORDER BY created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_coin_transactions
  FROM (
    SELECT amount, type, notes, created_at
    FROM public.coin_transactions
    WHERE user_id = p_target_user_id
    ORDER BY created_at DESC
    LIMIT 10
  ) ctx;

  -- 7. Ambil kuota fitur saat ini (misal universal_ai atau kuota bulanan)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'feature_slug', f.slug,
        'feature_name', f.name,
        'used_count', qu.used_count,
        'period_end', qu.period_end
      )
    ),
    '[]'::jsonb
  )
  INTO v_quota_summary
  FROM public.quota_usage qu
  JOIN public.ai_features f ON qu.feature_id = f.id
  WHERE qu.user_id = p_target_user_id;

  -- 8. Bentuk DTO CS-Safe (Tanpa URL gambar, tanpa diagnosis wajah)
  v_result := jsonb_build_object(
    'user_id', v_profile.id,
    'full_name', v_profile.full_name,
    'username', v_profile.username,
    'registered_at', v_profile.created_at,
    'subscription', jsonb_build_object(
      'status', COALESCE(v_subscription.status, 'none'),
      'tier_name', COALESCE(v_subscription.tier_name, 'Free'),
      'tier_slug', COALESCE(v_subscription.tier_slug, 'free'),
      'started_at', v_subscription.started_at,
      'expires_at', v_subscription.expires_at
    ),
    'coin_balance', COALESCE(v_coin_balance, 0),
    'recent_invoices', v_invoices,
    'recent_coin_transactions', v_coin_transactions,
    'quota_summary', v_quota_summary
  );

  RETURN v_result;
END;
$$;

-- Hak eksekusi RPC untuk pengguna terotentikasi
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_user_coins(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cs_get_customer_summary(uuid) TO authenticated;
