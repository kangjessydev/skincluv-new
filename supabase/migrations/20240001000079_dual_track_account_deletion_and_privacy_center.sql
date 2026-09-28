-- ============================================================
-- Migration 079: Dual-Track Account Deletion & Privacy Center RPC
-- Kepatuhan: UU PDP No. 27/2022 & Invarian 20
-- 1. Mengubah FK tripay_invoices.user_id menjadi NULLABLE ON DELETE SET NULL
-- 2. Membuat Stored Procedure atomik delete_user_account()
-- 3. Membuat Stored Procedure atomik delete_user_face_scans_only()
-- ============================================================

-- 1. Hardening tripay_invoices: Financial Records Preservation (Non-PII)
ALTER TABLE public.tripay_invoices
  ALTER COLUMN user_id DROP NOT NULL;

-- Cari nama foreign key constraint tripay_invoices -> profiles
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'tripay_invoices'
      AND kcu.column_name = 'user_id'
  ) LOOP
    EXECUTE 'ALTER TABLE public.tripay_invoices DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
  END LOOP;
END $$;

-- Buat ulang foreign key dengan ON DELETE SET NULL
ALTER TABLE public.tripay_invoices
  ADD CONSTRAINT fk_tripay_invoices_user_id
  FOREIGN KEY (user_id) REFERENCES public.profiles(id)
  ON DELETE SET NULL;


-- 2. RPC: Hapus Seluruh Rekam Jejak Foto Wajah Saja (Tanpa Hapus Akun)
CREATE OR REPLACE FUNCTION public.delete_user_face_scans_only(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id uuid;
  v_deleted_count integer := 0;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL OR v_caller_id <> p_user_id THEN
    RAISE EXCEPTION 'Otorisasi ditolak. Anda hanya dapat mengelola data akun Anda sendiri.';
  END IF;

  -- Hitung dan hapus dari tabel face_scans
  WITH deleted AS (
    DELETE FROM public.face_scans
    WHERE user_id = p_user_id
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_count FROM deleted;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_scans_count', v_deleted_count,
    'message', 'Seluruh rekam jejak pemindaian wajah berhasil dimusnahkan dari sistem operasional.'
  );
END;
$$;


-- 3. RPC: Hapus Akun Mandiri (Right to be Forgotten UU PDP No. 27/2022)
CREATE OR REPLACE FUNCTION public.delete_user_account(
  p_user_id uuid,
  p_confirmation text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id uuid;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL OR v_caller_id <> p_user_id THEN
    RAISE EXCEPTION 'Otorisasi ditolak. Anda hanya dapat menghapus akun Anda sendiri.';
  END IF;

  IF trim(p_confirmation) <> 'DELETE MY ACCOUNT' THEN
    RAISE EXCEPTION 'Konfirmasi tidak valid. Harap ketik DELETE MY ACCOUNT persis untuk melanjutkan.';
  END IF;

  -- A. Hapus data percakapan & memori klinis
  DELETE FROM public.user_clinical_memories WHERE user_id = p_user_id;
  DELETE FROM public.chat_session_summaries WHERE user_id = p_user_id;
  DELETE FROM public.chat_messages WHERE session_id IN (
    SELECT id FROM public.chat_sessions WHERE user_id = p_user_id
  );
  DELETE FROM public.chat_sessions WHERE user_id = p_user_id;

  -- B. Hapus data biometrik wajah & ingredient scans
  DELETE FROM public.face_scans WHERE user_id = p_user_id;
  DELETE FROM public.ingredient_scans WHERE user_id = p_user_id;

  -- C. Hapus data gamifikasi & koin
  DELETE FROM public.user_missions WHERE user_id = p_user_id;
  DELETE FROM public.coin_transactions WHERE user_id = p_user_id;
  DELETE FROM public.coin_balances WHERE user_id = p_user_id;

  -- D. Hapus kuota & langganan
  DELETE FROM public.quota_usage WHERE user_id = p_user_id;
  DELETE FROM public.subscriptions WHERE user_id = p_user_id;

  -- E. Lepas referensi transaksi Tripay (SET NULL) secara eksplisit
  UPDATE public.tripay_invoices
  SET user_id = NULL
  WHERE user_id = p_user_id;

  -- F. Hapus profil publik pengguna
  DELETE FROM public.profiles WHERE id = p_user_id;

  -- G. Hapus dari auth.users
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Akun dan seluruh data biometrik Anda telah dimusnahkan secara permanen dari sistem operasional.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_face_scans_only(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid, text) TO authenticated;
