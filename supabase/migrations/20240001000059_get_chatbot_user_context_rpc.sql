-- ==============================================================================
-- Migration 059: Chatbot User Context RPC & Deterministic Clinical Rules Matcher
-- RFC 006 Full AI Council Consensus (Claude, ChatGPT, DeepSeek, Kimi)
-- Principles:
-- 1. auth.uid() isolation — zero arbitrary p_user_id tampering
-- 2. Zero-query & data minimization when consent is OFF
-- 3. Canonical factual DTO (no raw AI response / database dump)
-- 4. Deterministic clinical risk matching
-- ==============================================================================

-- 1. RPC: get_chatbot_user_context()
CREATE OR REPLACE FUNCTION public.get_chatbot_user_context()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID;
  v_master_consent BOOLEAN;
  v_face_consent BOOLEAN;
  v_prod_consent BOOLEAN;
  v_profile JSONB;
  v_face_scan JSONB := NULL;
  v_ingredient_scans JSONB := '[]'::jsonb;
BEGIN
  -- 1. Ambil ID pengguna terverifikasi dari token JWT
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object(
      'authenticated', false,
      'master_consented', false,
      'face_scan', NULL,
      'ingredient_scans', '[]'::jsonb
    );
  END IF;

  -- 2. Baca status consent dari public.profiles
  SELECT
    chatbot_scan_master_consent,
    COALESCE(chatbot_face_scan_consent, true),
    COALESCE(chatbot_product_scan_consent, true),
    jsonb_build_object(
      'username', username,
      'full_name', full_name
    )
  INTO
    v_master_consent,
    v_face_consent,
    v_prod_consent,
    v_profile
  FROM public.profiles
  WHERE id = v_uid;

  -- Jika master consent tidak TRUE (FALSE atau NULL), kembalikan zero context (Zero-Query Policy)
  IF v_master_consent IS NOT TRUE THEN
    RETURN jsonb_build_object(
      'authenticated', true,
      'master_consented', false,
      'face_consented', v_face_consent,
      'product_consented', v_prod_consent,
      'profile', v_profile,
      'face_scan', NULL,
      'ingredient_scans', '[]'::jsonb
    );
  END IF;

  -- 3. Ambil rekam jejak Face Scan terbaru jika consent wajah aktif
  IF v_face_consent IS TRUE THEN
    SELECT jsonb_build_object(
      'id', fs.id,
      'scanned_at', fs.created_at,
      'age_hours', ROUND(EXTRACT(EPOCH FROM (now() - fs.created_at)) / 3600),
      'is_stale_14d', ((now() - fs.created_at) > interval '14 days'),
      'overall_score', fs.overall_score,
      'skin_type', fs.skin_type,
      'skin_status_title', fs.skin_status_title,
      'skin_concerns', fs.skin_concerns,
      'hero_actives', fs.product_recommendations,
      'area_evaluations', fs.area_evaluations
    )
    INTO v_face_scan
    FROM public.face_scans fs
    WHERE fs.user_id = v_uid
    ORDER BY fs.created_at DESC
    LIMIT 1;
  END IF;

  -- 4. Ambil 3 rekam jejak Ingredient Scan terbaru jika consent produk aktif
  IF v_prod_consent IS TRUE THEN
    SELECT COALESCE(jsonb_agg(prod_row), '[]'::jsonb)
    INTO v_ingredient_scans
    FROM (
      SELECT jsonb_build_object(
        'id', ings.id,
        'scanned_at', ings.created_at,
        'product_name', ings.product_name,
        'brand', ings.brand,
        'safety_score', ings.safety_score,
        'is_safe', ings.is_safe,
        'key_ingredients', ings.key_ingredients,
        'matched_concerns', ings.matched_concerns
      ) AS prod_row
      FROM public.ingredient_scans ings
      WHERE ings.user_id = v_uid
      ORDER BY ings.created_at DESC
      LIMIT 3
    ) sub;
  END IF;

  -- 5. Kembalikan canonical context aman
  RETURN jsonb_build_object(
    'authenticated', true,
    'master_consented', true,
    'face_consented', v_face_consent,
    'product_consented', v_prod_consent,
    'profile', v_profile,
    'face_scan', v_face_scan,
    'ingredient_scans', v_ingredient_scans
  );
END;
$$;

-- Izin eksekusi get_chatbot_user_context
REVOKE EXECUTE ON FUNCTION public.get_chatbot_user_context() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_chatbot_user_context() TO authenticated, service_role;

-- 2. Helper RPC: match_clinical_condition_rules
-- Mengecek kontraindikasi deterministik kondisi wajah vs kategori bahan kosmetik
CREATE OR REPLACE FUNCTION public.match_clinical_condition_rules(
  p_condition_flags TEXT[],
  p_ingredient_categories TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rules JSONB := '[]'::jsonb;
BEGIN
  IF p_condition_flags IS NULL OR array_length(p_condition_flags, 1) = 0
     OR p_ingredient_categories IS NULL OR array_length(p_ingredient_categories, 1) = 0 THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(r), '[]'::jsonb)
  INTO v_rules
  FROM (
    SELECT 
      cr.condition_flag,
      cr.ingredient_category,
      cr.severity,
      cr.risk_title,
      cr.clinical_rationale,
      cr.safe_alternative,
      cr.source_ref
    FROM public.clinical_condition_rules cr
    WHERE cr.is_active = true
      AND (
        lower(cr.condition_flag) = ANY(
          SELECT lower(unnest(p_condition_flags))
        )
        OR cr.condition_flag = 'all_conditions'
      )
      AND lower(cr.ingredient_category) = ANY(
        SELECT lower(unnest(p_ingredient_categories))
      )
    ORDER BY 
      CASE cr.severity
        WHEN 'forbidden_absolute' THEN 1
        WHEN 'forbidden_temporarily' THEN 2
        WHEN 'caution' THEN 3
        ELSE 4
      END
  ) r;

  RETURN v_rules;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.match_clinical_condition_rules(TEXT[], TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_clinical_condition_rules(TEXT[], TEXT[]) TO authenticated, service_role;
