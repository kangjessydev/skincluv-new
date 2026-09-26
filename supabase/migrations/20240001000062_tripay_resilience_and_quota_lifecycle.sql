-- ==============================================================================
-- Migration 062: Tripay Resilience, Quota Lifecycle, and Active Subscriptions View
-- RFC 010 Multi-Model Consensus (ChatGPT, Claude, DeepSeek, Kimi)
-- ==============================================================================

-- 1. Tambah kolom total_amount_idr dan paid_at di tripay_invoices
ALTER TABLE public.tripay_invoices 
  ADD COLUMN IF NOT EXISTS total_amount_idr integer,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Backfill default total_amount_idr dari amount_idr untuk data lama
UPDATE public.tripay_invoices 
SET total_amount_idr = amount_idr 
WHERE total_amount_idr IS NULL;

-- 2. Buat tabel audit tripay_callback_logs untuk investigasi forensik & duplicate delivery
CREATE TABLE IF NOT EXISTS public.tripay_callback_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_ref     text NOT NULL,
  tripay_reference text,
  status           text,
  amount_received  numeric,
  raw_payload      jsonb,
  ip_address       text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.tripay_callback_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tripay_callback_logs_admin" ON public.tripay_callback_logs;
CREATE POLICY "tripay_callback_logs_admin" ON public.tripay_callback_logs
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 3. Performance Indexes (DeepSeek Strategy: Target Webhook Latency <15 ms)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tripay_invoices_merchant_ref
  ON public.tripay_invoices (merchant_ref);

CREATE INDEX IF NOT EXISTS idx_tripay_invoices_reference
  ON public.tripay_invoices (reference)
  WHERE reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tripay_invoices_user_created
  ON public.tripay_invoices (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tripay_invoices_status
  ON public.tripay_invoices (status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at
  ON public.subscriptions (expires_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_tripay_callback_logs_merchant_ref
  ON public.tripay_callback_logs (merchant_ref, created_at DESC);

-- 4. View active_subscriptions (Claude Ground Truth Solution for "Zombie Pass")
-- Menjamin secara struktural bahwa langganan kedaluwarsa tidak bisa diakses
CREATE OR REPLACE VIEW public.active_subscriptions AS
SELECT 
  s.id,
  s.user_id,
  s.tier_id,
  s.status,
  s.started_at,
  s.expires_at,
  s.quota_reset_at,
  s.payment_ref,
  s.created_at,
  t.slug AS tier_slug,
  t.name AS tier_name,
  t.price_idr,
  t.features AS tier_features
FROM public.subscriptions s
JOIN public.subscription_tiers t ON s.tier_id = t.id
WHERE s.status = 'active' 
  AND s.expires_at > now();

GRANT SELECT ON public.active_subscriptions TO authenticated, service_role, anon;

-- 5. Stored Procedure Atomik process_tripay_payment (DeepSeek Advisory Lock + Prorata + Claude Quota Reset)
CREATE OR REPLACE FUNCTION public.process_tripay_payment(
  p_merchant_ref     text,
  p_tripay_reference text,
  p_amount_received  integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invoice          record;
  v_user_id          uuid;
  v_expected_amount  integer;
  v_target_tier      record;
  v_existing_sub     record;
  v_subscription_id  uuid;
  v_current_rate     numeric;
  v_new_rate         numeric;
  v_remaining_days   numeric;
  v_remaining_value  numeric;
  v_new_value        numeric;
  v_total_days       numeric;
  v_new_expiry       timestamptz;
BEGIN
  -- 1. Fast read invoice untuk mendapatkan user_id
  SELECT id, user_id, amount_idr, total_amount_idr, plan, status, reference
  INTO v_invoice
  FROM public.tripay_invoices
  WHERE merchant_ref = p_merchant_ref;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'code', 'INVOICE_NOT_FOUND', 
      'message', 'Invoice tidak ditemukan'
    );
  END IF;

  v_user_id := v_invoice.user_id;

  -- 2. Advisory Lock per User (DeepSeek Deadlock Prevention)
  -- Menserialisasi seluruh operasi finansial per-user agar kebal dari circular wait
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  -- 3. Kunci baris invoice dengan FOR UPDATE
  SELECT id, user_id, amount_idr, total_amount_idr, plan, status, reference
  INTO v_invoice
  FROM public.tripay_invoices
  WHERE merchant_ref = p_merchant_ref
  FOR UPDATE;

  -- 4. Idempotency Guard (Jika sudah PAID, langsung return sukses tanpa duplikasi pass)
  IF v_invoice.status = 'PAID' THEN
    RETURN jsonb_build_object(
      'success', true, 
      'code', 'ALREADY_PAID', 
      'message', 'Invoice sudah pernah diproses sebelumnya',
      'merchant_ref', p_merchant_ref
    );
  END IF;

  -- 5. Validasi Nominal Pembayaran (ChatGPT Amount Tampering Check)
  v_expected_amount := COALESCE(v_invoice.total_amount_idr, v_invoice.amount_idr);
  IF p_amount_received < v_expected_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'code', 'AMOUNT_MISMATCH', 
      'message', 'Nominal yang diterima (' || p_amount_received || ') kurang dari tagihan (' || v_expected_amount || ')'
    );
  END IF;

  -- 6. Transisi status atomik invoice UNPAID -> PAID
  UPDATE public.tripay_invoices
  SET status = 'PAID',
      reference = COALESCE(p_tripay_reference, reference),
      paid_at = now(),
      updated_at = now()
  WHERE id = v_invoice.id 
    AND status = 'UNPAID';

  -- 7. Cari Subscription Tier target
  SELECT id, slug, name, price_idr
  INTO v_target_tier
  FROM public.subscription_tiers
  WHERE lower(slug) = lower(v_invoice.plan) 
     OR lower(name) = lower(v_invoice.plan)
  LIMIT 1;

  IF v_target_tier IS NULL THEN
    -- Fallback ke premium jika nama tier tidak cocok
    SELECT id, slug, name, price_idr 
    INTO v_target_tier 
    FROM public.subscription_tiers 
    WHERE slug = 'premium';
  END IF;

  -- 8. Kunci baris subscription user saat ini
  SELECT s.id, s.tier_id, s.expires_at, s.started_at, t.slug AS current_plan_slug
  INTO v_existing_sub
  FROM public.subscriptions s
  LEFT JOIN public.subscription_tiers t ON s.tier_id = t.id
  WHERE s.user_id = v_user_id
  FOR UPDATE;

  -- 9. Kalkulasi Masa Aktif Berkeadilan (DeepSeek Value-Preserving Prorated Formula)
  v_new_rate := COALESCE(v_target_tier.price_idr, 49000)::numeric / 30.0;

  v_current_rate := CASE 
    WHEN v_existing_sub.current_plan_slug = 'glow' THEN 25000.0 / 30.0
    WHEN v_existing_sub.current_plan_slug = 'premium' THEN 49000.0 / 30.0
    ELSE 0.0
  END;

  -- Sisa hari di tier aktif saat ini
  IF v_existing_sub.id IS NOT NULL AND v_existing_sub.expires_at IS NOT NULL AND v_existing_sub.expires_at > now() THEN
    v_remaining_days := EXTRACT(EPOCH FROM (v_existing_sub.expires_at - now())) / 86400.0;
  ELSE
    v_remaining_days := 0.0;
  END IF;

  v_remaining_value := v_remaining_days * v_current_rate;
  v_new_value := 30.0 * v_new_rate;

  -- Total hari di tier baru
  v_total_days := (v_remaining_value + v_new_value) / v_new_rate;

  -- Batasi akumulasi maksimal 180 hari (6 bulan) demi batas liabilitas bisnis
  IF v_total_days > 180.0 THEN
    v_total_days := 180.0;
  END IF;

  v_new_expiry := now() + (v_total_days || ' days')::interval;

  -- 10. Upsert Entitlement Pass 30 Hari
  IF v_existing_sub.id IS NOT NULL THEN
    UPDATE public.subscriptions
    SET tier_id = v_target_tier.id,
        status = 'active',
        started_at = LEAST(now(), COALESCE(started_at, now())),
        expires_at = v_new_expiry,
        quota_reset_at = v_new_expiry,
        payment_ref = p_merchant_ref
    WHERE id = v_existing_sub.id;

    v_subscription_id := v_existing_sub.id;
  ELSE
    INSERT INTO public.subscriptions (
      user_id, tier_id, status, started_at, expires_at, quota_reset_at, payment_ref
    )
    VALUES (
      v_user_id, v_target_tier.id, 'active', now(), v_new_expiry, v_new_expiry, p_merchant_ref
    )
    RETURNING id INTO v_subscription_id;
  END IF;

  -- 11. Reset Kuota Pemakaian (Claude Solution for "Quota Lockout")
  -- Menghapus catatan kuota lama agar user langsung menikmati kuota baru secara utuh
  DELETE FROM public.quota_usage 
  WHERE subscription_id = v_subscription_id;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'PAYMENT_PROCESSED',
    'merchant_ref', p_merchant_ref,
    'tier', v_target_tier.slug,
    'total_days', ROUND(v_total_days, 1),
    'new_expires_at', v_new_expiry,
    'message', 'Pembayaran berhasil diproses dan kuota paket aktif segar'
  );
END;
$$;
