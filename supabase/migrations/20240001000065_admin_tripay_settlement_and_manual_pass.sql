-- ==============================================================================
-- Migration 065: Admin Tripay Settlement & Manual Pass Activation
-- Provides atomic manual settlement and sync capabilities for administrators
-- ==============================================================================

-- 1. Tambahkan audit kolom di tabel tripay_invoices
ALTER TABLE public.tripay_invoices 
  ADD COLUMN IF NOT EXISTS settlement_type text DEFAULT 'GATEWAY_WEBHOOK',
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS settled_by uuid REFERENCES public.profiles(id);

-- 2. Stored Procedure: admin_manual_settle_invoice
CREATE OR REPLACE FUNCTION public.admin_manual_settle_invoice(
  p_merchant_ref text,
  p_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invoice record;
  v_expected_amount integer;
  v_rpc_res jsonb;
BEGIN
  -- 1. Security Check: Hanya admin yang berhak melakukan manual settlement
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Hanya admin yang berhak melakukan manual settlement.';
  END IF;

  -- 2. Kunci & periksa invoice
  SELECT id, user_id, amount_idr, total_amount_idr, plan, status, reference
  INTO v_invoice
  FROM public.tripay_invoices
  WHERE merchant_ref = p_merchant_ref
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'message', 'Invoice tidak ditemukan.'
    );
  END IF;

  IF v_invoice.status = 'PAID' THEN
    RETURN jsonb_build_object(
      'success', true,
      'code', 'ALREADY_PAID',
      'message', 'Invoice ini sudah berstatus PAID sebelumnya.'
    );
  END IF;

  -- 3. Hitung nominal yang diharapkan
  v_expected_amount := COALESCE(v_invoice.total_amount_idr, v_invoice.amount_idr);

  -- 4. Eksekusi pembayaran atomik & perpanjangan subscription via procedure resmi
  v_rpc_res := public.process_tripay_payment(
    p_merchant_ref,
    COALESCE(v_invoice.reference, 'MANUAL_ADMIN_' || p_merchant_ref),
    v_expected_amount
  );

  IF NOT COALESCE((v_rpc_res->>'success')::boolean, false) THEN
    RETURN v_rpc_res;
  END IF;

  -- 5. Tandai invoice sebagai ADMIN_MANUAL beserta audit trail
  UPDATE public.tripay_invoices
  SET settlement_type = 'ADMIN_MANUAL',
      admin_notes = p_notes,
      settled_by = auth.uid(),
      updated_at = now()
  WHERE id = v_invoice.id;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'SETTLED_MANUALLY',
    'message', 'Invoice berhasil diselesaikan secara manual oleh admin.',
    'merchant_ref', p_merchant_ref,
    'details', v_rpc_res
  );
END;
$$;

-- 3. Stored Procedure: admin_manual_create_and_settle_pass
CREATE OR REPLACE FUNCTION public.admin_manual_create_and_settle_pass(
  p_user_id uuid,
  p_plan text,
  p_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan_clean text := upper(trim(p_plan));
  v_amount integer;
  v_merchant_ref text;
  v_tier record;
  v_res jsonb;
BEGIN
  -- 1. Security Check
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Hanya admin yang berhak membuat transaksi pass manual.';
  END IF;

  -- 2. Validasi profil pengguna
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pengguna tidak ditemukan.');
  END IF;

  -- 3. Ambil data harga tier
  SELECT id, slug, name, price_idr
  INTO v_tier
  FROM public.subscription_tiers
  WHERE lower(slug) = lower(v_plan_clean)
     OR lower(name) = lower(v_plan_clean)
  LIMIT 1;

  IF v_tier IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Paket tier tidak valid.');
  END IF;

  v_amount := v_tier.price_idr;
  v_merchant_ref := 'MANUAL-' || upper(v_tier.slug) || '-' || to_char(now(), 'YYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 6);

  -- 4. Masukkan invoice
  INSERT INTO public.tripay_invoices (
    user_id,
    merchant_ref,
    reference,
    amount_idr,
    total_amount_idr,
    plan,
    status,
    settlement_type,
    admin_notes,
    settled_by
  ) VALUES (
    p_user_id,
    v_merchant_ref,
    v_merchant_ref,
    v_amount,
    v_amount,
    v_tier.slug,
    'UNPAID',
    'ADMIN_MANUAL',
    p_notes,
    auth.uid()
  );

  -- 5. Settle seketika
  v_res := public.process_tripay_payment(
    v_merchant_ref,
    v_merchant_ref,
    v_amount
  );

  IF NOT COALESCE((v_res->>'success')::boolean, false) THEN
    RETURN v_res;
  END IF;

  UPDATE public.tripay_invoices
  SET settlement_type = 'ADMIN_MANUAL',
      admin_notes = p_notes,
      settled_by = auth.uid(),
      updated_at = now()
  WHERE merchant_ref = v_merchant_ref;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Pass manual berhasil dibuat dan diaktifkan.',
    'merchant_ref', v_merchant_ref,
    'details', v_res
  );
END;
$$;

-- 4. Berikan izin eksekusi ke authenticated user (dijaga oleh is_admin())
GRANT EXECUTE ON FUNCTION public.admin_manual_settle_invoice(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_manual_create_and_settle_pass(uuid, text, text) TO authenticated;
