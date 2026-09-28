-- ============================================================
-- Migration 076: Align cs_get_customer_summary with Canonical Views
-- 1. Gunakan view kanonikal public.active_subscriptions (Migration 062)
--    untuk mencegah false positive status langganan kedaluwarsa ("Zombie Pass").
-- 2. Dukung fallback ke riwayat langganan sebelumnya berstatus 'expired'
--    jika pengguna tidak memiliki langganan aktif, agar CS memiliki konteks.
-- 3. Sertakan reference, merchant_ref, dan tripay_reference secara konsisten.
-- ============================================================

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
  v_user_id uuid;
  v_full_name text;
  v_username text;
  v_created_at timestamptz;
  v_sub_status text := 'none';
  v_sub_tier_name text := 'Free';
  v_sub_tier_slug text := 'free';
  v_sub_started_at timestamptz := null;
  v_sub_expires_at timestamptz := null;
  v_coin_balance integer := 0;
  v_invoices jsonb := '[]'::jsonb;
  v_coin_transactions jsonb := '[]'::jsonb;
  v_quota_summary jsonb := '[]'::jsonb;
  v_result jsonb;
BEGIN
  -- 1. Otorisasi: Hanya admin atau support_agent
  SELECT (
    public.is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'tech_lead', 'business_lead', 'support_agent')
    )
  ) INTO v_caller_authorized;

  IF NOT v_caller_authorized THEN
    RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki wewenang Customer Support';
  END IF;

  -- 2. Ambil profil dasar (NON-BIOMETRIK, NON-KLINIS demi UU PDP Invarian 16)
  SELECT id, full_name, username, created_at
  INTO v_user_id, v_full_name, v_username, v_created_at
  FROM public.profiles
  WHERE id = p_target_user_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna tidak ditemukan';
  END IF;

  -- 3. Ambil data langganan aktif dari view kanonikal active_subscriptions (Migration 062)
  SELECT status, started_at, expires_at, tier_name, tier_slug
  INTO v_sub_status, v_sub_started_at, v_sub_expires_at, v_sub_tier_name, v_sub_tier_slug
  FROM public.active_subscriptions
  WHERE user_id = p_target_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Jika tidak ada di active_subscriptions, cek apakah pernah berlangganan sebelumnya (riwayat expired)
  IF v_sub_status = 'none' OR v_sub_status IS NULL THEN
    SELECT 'expired', s.started_at, s.expires_at, COALESCE(t.name, 'Free'), COALESCE(t.slug, 'free')
    INTO v_sub_status, v_sub_started_at, v_sub_expires_at, v_sub_tier_name, v_sub_tier_slug
    FROM public.subscriptions s
    LEFT JOIN public.subscription_tiers t ON s.tier_id = t.id
    WHERE s.user_id = p_target_user_id
    ORDER BY s.created_at DESC
    LIMIT 1;
  END IF;

  -- 4. Ambil saldo koin
  SELECT COALESCE(balance, 0)
  INTO v_coin_balance
  FROM public.coin_balances
  WHERE user_id = p_target_user_id;

  -- 5. Ambil riwayat invoice Tripay terbaru (maks 10)
  -- Menggunakan kolom kanonikal: reference, merchant_ref, total_amount_idr / amount_idr
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'tripay_reference', COALESCE(reference, merchant_ref),
        'reference', reference,
        'merchant_ref', merchant_ref,
        'plan', plan,
        'amount_idr', COALESCE(total_amount_idr, amount_idr),
        'status', status,
        'settlement_type', settlement_type,
        'created_at', created_at,
        'paid_at', paid_at
      ) ORDER BY created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_invoices
  FROM (
    SELECT reference, merchant_ref, plan, amount_idr, total_amount_idr, status, settlement_type, created_at, paid_at
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

  -- 7. Ambil kuota fitur saat ini jika ada
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
    'user_id', v_user_id,
    'full_name', v_full_name,
    'username', v_username,
    'registered_at', v_created_at,
    'subscription', jsonb_build_object(
      'status', COALESCE(v_sub_status, 'none'),
      'tier_name', COALESCE(v_sub_tier_name, 'Free'),
      'tier_slug', COALESCE(v_sub_tier_slug, 'free'),
      'started_at', v_sub_started_at,
      'expires_at', v_sub_expires_at
    ),
    'coin_balance', COALESCE(v_coin_balance, 0),
    'recent_invoices', v_invoices,
    'recent_coin_transactions', v_coin_transactions,
    'quota_summary', v_quota_summary
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cs_get_customer_summary(uuid) TO authenticated;
