-- Migration 049: Financial Concurrency Hardening & Idempotency Engine
-- Consensus AI Council: ChatGPT (Security Red Team), Claude (Architect), DeepSeek (Math Optimizer)

-- 1. Deduplikasi anomali historis pada coin_transactions (mempertahankan transaksi pertama)
DELETE FROM public.coin_transactions
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, reference_id ORDER BY created_at ASC) as rn
    FROM public.coin_transactions
    WHERE reference_id IS NOT NULL
  ) sub
  WHERE rn > 1
);

-- 2. Pasang Unique Index Idempotensi pada coin_transactions
CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_transactions_user_ref_unique
  ON public.coin_transactions (user_id, reference_id)
  WHERE reference_id IS NOT NULL;

-- 3. Pasang BRIN Index untuk optimasi I/O disk range scan bulanan (DeepSeek RFC 003)
CREATE INDEX IF NOT EXISTS idx_air_created_brin
  ON public.ai_request_logs USING BRIN (created_at)
  WITH (pages_per_range = 32);

CREATE INDEX IF NOT EXISTS idx_coin_created_brin
  ON public.coin_transactions USING BRIN (created_at)
  WITH (pages_per_range = 32);

-- 4. Hardening deduct_coins: Idempotent Semantic + Row Lock + search_path pinned
CREATE OR REPLACE FUNCTION public.deduct_coins(
  p_user_id      uuid,
  p_amount       integer,
  p_reference_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_balance integer;
  v_existing_amount integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be positive';
  END IF;

  IF p_reference_id IS NULL THEN
    RAISE EXCEPTION 'p_reference_id is required for financial idempotency';
  END IF;

  -- Semantik Idempotensi: Cek apakah reference_id sudah pernah diproses untuk user ini
  SELECT amount INTO v_existing_amount
  FROM public.coin_transactions
  WHERE user_id = p_user_id AND reference_id = p_reference_id;

  IF FOUND THEN
    -- Jika amount sama, anggap retry valid (No-Op sukses)
    IF v_existing_amount = -p_amount THEN
      RETURN true;
    ELSE
      -- Jika reference_id sama tapi amount berbeda, tolak sebagai idempotency conflict
      RAISE EXCEPTION 'Idempotency conflict: reference_id % already used with amount %', p_reference_id, -v_existing_amount;
    END IF;
  END IF;

  -- Kunci baris saldo untuk mencegah race condition (Atomic Lock)
  SELECT balance INTO v_balance
  FROM public.coin_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND OR v_balance < p_amount THEN
    RETURN false;
  END IF;

  -- Potong saldo
  UPDATE public.coin_balances
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id;

  -- Catat ke immutable ledger
  INSERT INTO public.coin_transactions (user_id, amount, type, reference_id, notes)
  VALUES (p_user_id, -p_amount, 'ai_usage', p_reference_id, 'AI feature usage');

  RETURN true;
END;
$$;

-- 5. Hardening claim_mission: Mencegah TOCTOU race condition dengan FOR UPDATE
CREATE OR REPLACE FUNCTION public.claim_mission(p_mission_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_mission record;
  v_user_mission record;
  v_str_ref text;
  v_ref_id uuid;
  v_already_claimed boolean;
  v_new_balance integer;
  v_is_expired boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED', 'message', 'Pengguna belum terautentikasi');
  END IF;

  -- Lookup data misi
  SELECT id, slug, name, coin_reward, target_count, type, cooldown_hours
  INTO v_mission
  FROM public.missions
  WHERE slug = p_mission_slug AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'MISSION_NOT_FOUND', 'message', 'Misi tidak ditemukan atau non-aktif');
  END IF;

  -- Lock baris progress user_missions FOR UPDATE (Mencegah TOCTOU double-claim)
  SELECT current_count, is_completed, completed_at, last_activity
  INTO v_user_mission
  FROM public.user_missions
  WHERE user_id = v_user_id AND mission_id = v_mission.id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROGRESS_NOT_REACHED', 'message', 'Progres misi belum dimulai');
  END IF;

  -- Cek masa kedaluwarsa periode misi
  v_is_expired := false;
  IF v_mission.type = 'daily' THEN
    IF (v_user_mission.last_activity::date < current_date) OR
       (v_user_mission.completed_at IS NOT NULL AND v_user_mission.completed_at::date < current_date) THEN
      v_is_expired := true;
    END IF;
  ELSIF v_mission.type = 'weekly' THEN
    IF (to_char(COALESCE(v_user_mission.completed_at, v_user_mission.last_activity), 'IYYY_IW') <> to_char(now(), 'IYYY_IW')) OR
       (v_user_mission.completed_at IS NOT NULL AND now() >= v_user_mission.completed_at + (COALESCE(v_mission.cooldown_hours, 144) || ' hours')::interval) THEN
      v_is_expired := true;
    END IF;
  END IF;

  IF v_is_expired THEN
    UPDATE public.user_missions
    SET current_count = 0, is_completed = false, completed_at = NULL, last_activity = now()
    WHERE user_id = v_user_id AND mission_id = v_mission.id;

    RETURN jsonb_build_object('success', false, 'error', 'PROGRESS_NOT_REACHED', 'message', 'Periode misi telah berganti. Silakan selesaikan target misi periode ini.');
  END IF;

  IF v_user_mission.is_completed AND NOT v_is_expired THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED', 'message', 'Hadiah misi ini sudah pernah diklaim untuk periode ini');
  END IF;

  IF v_user_mission.current_count < v_mission.target_count THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROGRESS_NOT_REACHED', 'message', 'Progres misi belum mencapai target');
  END IF;

  -- Buat deterministic reference ID berbasis tanggal/minggu
  IF v_mission.type = 'daily' THEN
    v_str_ref := 'claim_' || v_mission.slug || '_' || to_char(now(), 'YYYYMMDD');
  ELSIF v_mission.type = 'weekly' THEN
    v_str_ref := 'claim_' || v_mission.slug || '_' || to_char(now(), 'IYYY"W"IW');
  ELSE
    v_str_ref := 'claim_' || v_mission.slug;
  END IF;
  v_ref_id := CAST(md5(v_str_ref) AS uuid);

  -- Cek mutlak di ledger transaksi
  SELECT EXISTS(
    SELECT 1 FROM public.coin_transactions
    WHERE user_id = v_user_id AND reference_id = v_ref_id
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED', 'message', 'Hadiah misi ini sudah pernah diklaim untuk periode ini');
  END IF;

  -- Tandai selesai
  UPDATE public.user_missions
  SET is_completed = true, completed_at = now()
  WHERE user_id = v_user_id AND mission_id = v_mission.id;

  -- Catat transaksi unik
  INSERT INTO public.coin_transactions (user_id, amount, type, reference_id, notes)
  VALUES (v_user_id, v_mission.coin_reward, 'mission_reward', v_ref_id, 'Klaim hadiah misi: ' || v_mission.name);

  -- Update saldo secara atomik
  INSERT INTO public.coin_balances (user_id, balance, updated_at)
  VALUES (v_user_id, v_mission.coin_reward, now())
  ON CONFLICT (user_id)
  DO UPDATE SET balance = coin_balances.balance + v_mission.coin_reward, updated_at = now()
  RETURNING balance INTO v_new_balance;

  RETURN jsonb_build_object(
    'success', true,
    'coins_awarded', v_mission.coin_reward,
    'new_balance', v_new_balance,
    'message', 'Berhasil mengklaim ' || v_mission.coin_reward || ' koin!'
  );
END;
$$;

-- 6. Hardening rollback_deduction: Refund Idempotent dengan prefix REFUND deterministik
CREATE OR REPLACE FUNCTION public.rollback_deduction(
  p_user_id         uuid,
  p_feature_id      uuid,
  p_subscription_id uuid,
  p_mode            text,
  p_coin_amount     integer DEFAULT NULL::integer,
  p_coin_ref        uuid    DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_refund_ref uuid;
BEGIN
  IF p_mode = 'quota' THEN
    UPDATE public.quota_usage
    SET used_count = GREATEST(used_count - 1, 0)
    WHERE user_id = p_user_id
      AND feature_id = p_feature_id
      AND subscription_id = p_subscription_id;

  ELSIF p_mode = 'coin' AND p_coin_amount IS NOT NULL THEN
    -- Buat deterministic refund reference berbasis reference original
    IF p_coin_ref IS NOT NULL THEN
      v_refund_ref := CAST(md5('refund_' || p_coin_ref::text) AS uuid);
    ELSE
      v_refund_ref := gen_random_uuid();
    END IF;

    -- Cegah refund ganda jika reference_id refund sudah ada
    IF EXISTS (
      SELECT 1 FROM public.coin_transactions
      WHERE user_id = p_user_id AND reference_id = v_refund_ref AND type = 'admin_adjustment'
    ) THEN
      RETURN; -- Sudah pernah di-refund, abaikan (idempotent)
    END IF;

    UPDATE public.coin_balances
    SET balance = balance + p_coin_amount, updated_at = now()
    WHERE user_id = p_user_id;

    INSERT INTO public.coin_transactions (user_id, amount, type, reference_id, notes)
    VALUES (p_user_id, p_coin_amount, 'admin_adjustment', v_refund_ref, 'Refund: AI provider error');
  END IF;
END;
$$;

-- 7. Hardening credit_coins: search_path pinned
CREATE OR REPLACE FUNCTION public.credit_coins(
  p_user_id    uuid,
  p_amount     integer,
  p_mission_id uuid,
  p_notes      text DEFAULT 'Mission reward'::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be positive';
  END IF;

  UPDATE public.coin_balances
  SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.coin_transactions (user_id, amount, type, reference_id, notes)
  VALUES (p_user_id, p_amount, 'mission_reward', p_mission_id, p_notes);
END;
$$;

-- 8. Stored Procedure Atomik Webhook Tripay (UNPAID -> PAID + Entitlement Protection)
CREATE OR REPLACE FUNCTION public.process_tripay_payment(
  p_merchant_ref     text,
  p_tripay_reference text,
  p_amount_received  integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invoice record;
  v_tier_id uuid;
  v_existing_sub record;
  v_base_date timestamptz;
  v_new_expiry timestamptz;
BEGIN
  -- 1. Kunci baris invoice FOR UPDATE
  SELECT id, user_id, amount_idr, plan, status
  INTO v_invoice
  FROM public.tripay_invoices
  WHERE merchant_ref = p_merchant_ref
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVOICE_NOT_FOUND', 'message', 'Invoice tidak ditemukan');
  END IF;

  -- 2. Idempotency Gate: Jika sudah PAID, return sukses tanpa perpanjangan ulang
  IF v_invoice.status = 'PAID' THEN
    RETURN jsonb_build_object('success', true, 'code', 'ALREADY_PAID', 'message', 'Invoice sudah pernah diproses sebelumnya');
  END IF;

  -- 3. Validasi nominal pembayaran
  IF p_amount_received < v_invoice.amount_idr THEN
    RETURN jsonb_build_object('success', false, 'code', 'AMOUNT_MISMATCH', 'message', 'Nominal bayar tidak sesuai tagihan');
  END IF;

  -- 4. Transisi status atomik UNPAID -> PAID
  UPDATE public.tripay_invoices
  SET status = 'PAID',
      reference = COALESCE(p_tripay_reference, reference),
      updated_at = now()
  WHERE id = v_invoice.id;

  -- 5. Cari subscription tier yang cocok
  SELECT id INTO v_tier_id
  FROM public.subscription_tiers
  WHERE lower(slug) = lower(v_invoice.plan) OR lower(name) = lower(v_invoice.plan)
  LIMIT 1;

  IF v_tier_id IS NULL THEN
    -- Fallback ke tier premium jika nama plan tidak cocok persis
    SELECT id INTO v_tier_id FROM public.subscription_tiers WHERE slug = 'premium';
  END IF;

  -- 6. Tangani subscription secara atomik dengan rumus perpanjangan cerdas:
  -- base = max(now(), existing.expires_at)
  SELECT id, expires_at INTO v_existing_sub
  FROM public.subscriptions
  WHERE user_id = v_invoice.user_id
  FOR UPDATE;

  IF FOUND AND v_existing_sub.expires_at IS NOT NULL AND v_existing_sub.expires_at > now() THEN
    v_base_date := v_existing_sub.expires_at;
  ELSE
    v_base_date := now();
  END IF;

  v_new_expiry := v_base_date + interval '1 month';

  IF FOUND THEN
    UPDATE public.subscriptions
    SET tier_id = v_tier_id,
        status = 'active',
        started_at = LEAST(now(), started_at),
        expires_at = v_new_expiry,
        quota_reset_at = v_new_expiry,
        payment_ref = p_merchant_ref
    WHERE id = v_existing_sub.id;
  ELSE
    INSERT INTO public.subscriptions (
      user_id, tier_id, status, started_at, expires_at, quota_reset_at, payment_ref
    )
    VALUES (
      v_invoice.user_id, v_tier_id, 'active', now(), v_new_expiry, v_new_expiry, p_merchant_ref
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'PAYMENT_PROCESSED',
    'merchant_ref', p_merchant_ref,
    'new_expires_at', v_new_expiry,
    'message', 'Pembayaran berhasil diproses dan langganan diperpanjang'
  );
END;
$$;
