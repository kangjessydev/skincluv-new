-- ==============================================================================
-- Migration: 20240001000088_switch_all_models_to_gemini_and_clear_seed_correlations.sql
-- Description:
-- 1. Clears the 8 initial seed rows from public.market_skin_product_correlations
--    so Market Intelligence starts purely from real user scan data (0 dummy/seed rows).
-- 2. Switches all active AI features (including chatbot) to Google Gemini Free Tier
--    (gemini-3.5-flash using gemini_api_key) for unified AI Studio token verification,
--    while preserving existing Groq model configurations (is_active = false, NOT deleted).
-- ==============================================================================

-- 1. Clear hardcoded initial seed correlations from Migration 038
DELETE FROM public.market_skin_product_correlations
WHERE product_name IN (
  'Acne Care 2% BHA Salicylic Acid Serum',
  '5X Ceramide Barrier Moisture Gel',
  'Dark Spot Correcting Glow Serum',
  'Brightening Serum Tranexamic Acid 3%',
  'Galactomyces Ferment Filtrate Essence',
  'Pore Clarifying Niacinamide 10% Toner',
  'Calming Cicamide Relief Cream',
  'Encapsulated Retinol 1% Renewal Serum'
)
AND occurrence_count IN (142, 98, 115, 84, 76, 63, 120, 59);

-- 2. Switch Chatbot and all AI features to Google Gemini (gemini-3.5-flash)
--    without deleting existing Groq or alternative model_configs rows.
DO $$
DECLARE
  v_chatbot_id UUID;
  v_face_analysis_id UUID;
  v_face_validation_id UUID;
  v_ingredient_scan_id UUID;
  v_google_chatbot_config_id UUID;
BEGIN
  SELECT id INTO v_chatbot_id FROM public.ai_features WHERE slug = 'chatbot' LIMIT 1;
  SELECT id INTO v_face_analysis_id FROM public.ai_features WHERE slug = 'face_analysis' LIMIT 1;
  SELECT id INTO v_face_validation_id FROM public.ai_features WHERE slug = 'face_validation' LIMIT 1;
  SELECT id INTO v_ingredient_scan_id FROM public.ai_features WHERE slug = 'ingredient_scan' LIMIT 1;

  -- A. Chatbot: deactivate non-google configs (keep Groq row intact!), activate Google gemini-3.5-flash
  IF v_chatbot_id IS NOT NULL THEN
    UPDATE public.model_configs
    SET is_active = false
    WHERE feature_id = v_chatbot_id
      AND provider <> 'google';

    SELECT id INTO v_google_chatbot_config_id
    FROM public.model_configs
    WHERE feature_id = v_chatbot_id
      AND provider = 'google'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_google_chatbot_config_id IS NOT NULL THEN
      UPDATE public.model_configs
      SET is_active = false
      WHERE feature_id = v_chatbot_id
        AND provider = 'google'
        AND id <> v_google_chatbot_config_id;

      UPDATE public.model_configs
      SET model_name = 'gemini-3.5-flash',
          api_key_secret = 'gemini_api_key',
          parameters = '{"temperature": 0.7, "max_tokens": 1200, "thinking_budget": 0}'::jsonb,
          is_active = true
      WHERE id = v_google_chatbot_config_id;
    ELSE
      INSERT INTO public.model_configs (feature_id, provider, model_name, api_key_secret, parameters, is_active)
      VALUES (
        v_chatbot_id,
        'google',
        'gemini-3.5-flash',
        'gemini_api_key',
        '{"temperature": 0.7, "max_tokens": 1200, "thinking_budget": 0}'::jsonb,
        true
      );
    END IF;
  END IF;

  -- B. Face Analysis: ensure Google gemini-3.5-flash is active
  IF v_face_analysis_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.model_configs WHERE feature_id = v_face_analysis_id AND provider = 'google') THEN
      UPDATE public.model_configs
      SET is_active = false
      WHERE feature_id = v_face_analysis_id AND provider <> 'google';

      UPDATE public.model_configs
      SET model_name = 'gemini-3.5-flash',
          api_key_secret = 'gemini_api_key',
          is_active = true
      WHERE id = (
        SELECT id FROM public.model_configs
        WHERE feature_id = v_face_analysis_id AND provider = 'google'
        ORDER BY is_active DESC, created_at DESC
        LIMIT 1
      );
    ELSE
      INSERT INTO public.model_configs (feature_id, provider, model_name, api_key_secret, parameters, is_active)
      VALUES (
        v_face_analysis_id,
        'google',
        'gemini-3.5-flash',
        'gemini_api_key',
        '{"temperature": 0, "top_p": 1, "seed": 42, "max_tokens": 8192, "response_mime_type": "application/json"}'::jsonb,
        true
      );
    END IF;
  END IF;

  -- C. Face Validation: ensure Google gemini-3.5-flash is active
  IF v_face_validation_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.model_configs WHERE feature_id = v_face_validation_id AND provider = 'google') THEN
      UPDATE public.model_configs
      SET is_active = false
      WHERE feature_id = v_face_validation_id AND provider <> 'google';

      UPDATE public.model_configs
      SET model_name = 'gemini-3.5-flash',
          api_key_secret = 'gemini_api_key',
          is_active = true
      WHERE id = (
        SELECT id FROM public.model_configs
        WHERE feature_id = v_face_validation_id AND provider = 'google'
        ORDER BY is_active DESC, created_at DESC
        LIMIT 1
      );
    ELSE
      INSERT INTO public.model_configs (feature_id, provider, model_name, api_key_secret, parameters, is_active)
      VALUES (
        v_face_validation_id,
        'google',
        'gemini-3.5-flash',
        'gemini_api_key',
        '{"temperature": 0.1, "max_tokens": 250, "thinking_budget": 0}'::jsonb,
        true
      );
    END IF;
  END IF;

  -- D. Ingredient Scan: ensure Google gemini-3.5-flash is active
  IF v_ingredient_scan_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.model_configs WHERE feature_id = v_ingredient_scan_id AND provider = 'google') THEN
      UPDATE public.model_configs
      SET is_active = false
      WHERE feature_id = v_ingredient_scan_id AND provider <> 'google';

      UPDATE public.model_configs
      SET model_name = 'gemini-3.5-flash',
          api_key_secret = 'gemini_api_key',
          is_active = true
      WHERE id = (
        SELECT id FROM public.model_configs
        WHERE feature_id = v_ingredient_scan_id AND provider = 'google'
        ORDER BY is_active DESC, created_at DESC
        LIMIT 1
      );
    ELSE
      INSERT INTO public.model_configs (feature_id, provider, model_name, api_key_secret, parameters, is_active)
      VALUES (
        v_ingredient_scan_id,
        'google',
        'gemini-3.5-flash',
        'gemini_api_key',
        '{"temperature": 0.3, "max_tokens": 8192, "thinking_budget": 0, "response_mime_type": "application/json"}'::jsonb,
        true
      );
    END IF;
  END IF;
END $$;
