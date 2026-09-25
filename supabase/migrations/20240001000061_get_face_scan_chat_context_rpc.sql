-- ============================================================
-- Migration 061: Secure Face Scan Chat Context RPC (RFC 009)
-- 1. get_face_scan_chat_context(p_scan_id) with Zero-IDOR check
-- 2. UU PDP Consent verification (RFC 006 chatbot_face_scan_consent)
-- 3. Compact canonical DTO projection (no raw_ai_response leakage)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_face_scan_chat_context(p_scan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_scan record;
  v_consent boolean;
  v_result jsonb;
BEGIN
  -- Strict Zero-IDOR authentication check
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- 1. Cek Consent UU PDP (RFC 006)
  SELECT COALESCE(chatbot_face_scan_consent, chatbot_scan_master_consent, true)
  INTO v_consent
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_consent = false THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'User has disabled face scan context consent'
    );
  END IF;

  -- 2. Ambil data scan dengan verifikasi kepemilikan mutlak
  SELECT id, overall_score, skin_status_title, skin_type, skin_concerns, analysis_notes, created_at
  INTO v_scan
  FROM public.face_scans
  WHERE id = p_scan_id AND user_id = v_user_id;

  IF v_scan.id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Scan not found or unauthorized'
    );
  END IF;

  -- 3. Proyeksikan DTO ringkas dan aman
  v_result := jsonb_build_object(
    'allowed', true,
    'scan_id', v_scan.id,
    'scanned_at', v_scan.created_at,
    'skin_type', v_scan.skin_type,
    'overall_score', v_scan.overall_score,
    'status_title', COALESCE(v_scan.skin_status_title, 'Kondisi Kulit Terpantau'),
    'concerns', v_scan.skin_concerns,
    'summary_notes', v_scan.analysis_notes
  );

  RETURN v_result;
END;
$$;

-- Keamanan eksekusi
REVOKE ALL ON FUNCTION public.get_face_scan_chat_context(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_face_scan_chat_context(uuid) TO authenticated;
