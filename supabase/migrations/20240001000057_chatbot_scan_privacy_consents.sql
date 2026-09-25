-- ==============================================================================
-- Migration 057: Hierarchical Chatbot Scan Privacy Consents & Audit Trail
-- RFC 006 AI Council Consensus (ChatGPT Red Team & DeepSeek)
-- Compliance: UU PDP No. 27/2022 (Explicit Consent & Right to be Forgotten)
-- ==============================================================================

-- 1. Tambah kolom hirarki consent ke public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS chatbot_scan_master_consent BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS chatbot_face_scan_consent BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS chatbot_product_scan_consent BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS chatbot_consent_updated_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.profiles.chatbot_scan_master_consent IS 'Master switch for AI chatbot scan context access (UU PDP compliant): NULL=unasked, TRUE=enabled, FALSE=disabled';
COMMENT ON COLUMN public.profiles.chatbot_face_scan_consent IS 'Granular consent for latest face scan observation context: NULL/TRUE=enabled, FALSE=disabled';
COMMENT ON COLUMN public.profiles.chatbot_product_scan_consent IS 'Granular consent for latest product scan history context: NULL/TRUE=enabled, FALSE=disabled';
COMMENT ON COLUMN public.profiles.chatbot_consent_updated_at IS 'Audit timestamp of the last consent modification';

-- 2. Helper Stored Procedure: set_chatbot_scan_consent
-- Menjamin perubahan consent terekam secara atomik beserta audit timestamp
CREATE OR REPLACE FUNCTION public.set_chatbot_scan_consent(
  p_master BOOLEAN,
  p_face BOOLEAN DEFAULT NULL,
  p_product BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID;
  v_res JSONB;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET
    chatbot_scan_master_consent = p_master,
    chatbot_face_scan_consent = CASE 
      WHEN p_face IS NOT NULL THEN p_face 
      ELSE COALESCE(chatbot_face_scan_consent, true) 
    END,
    chatbot_product_scan_consent = CASE 
      WHEN p_product IS NOT NULL THEN p_product 
      ELSE COALESCE(chatbot_product_scan_consent, true) 
    END,
    chatbot_consent_updated_at = now(),
    updated_at = now()
  WHERE id = v_uid;

  SELECT jsonb_build_object(
    'success', true,
    'master_consent', chatbot_scan_master_consent,
    'face_consent', chatbot_face_scan_consent,
    'product_consent', chatbot_product_scan_consent,
    'updated_at', chatbot_consent_updated_at
  )
  INTO v_res
  FROM public.profiles
  WHERE id = v_uid;

  RETURN v_res;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_chatbot_scan_consent(BOOLEAN, BOOLEAN, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_chatbot_scan_consent(BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated, service_role;
