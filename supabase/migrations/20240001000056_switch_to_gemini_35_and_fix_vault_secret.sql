-- Migration 056: Switch active models to gemini-3.5-flash and fix api_key_secret for face_validation
-- gemini-3.6-flash has a strict free-tier daily cap (20 requests/day per project).
-- gemini-3.5-flash provides equivalent multimodal & reasoning performance with available quota.

-- 1. Fix face_validation api_key_secret from 'gemini' to 'gemini_api_key' and model_name to gemini-3.5-flash
UPDATE public.model_configs
SET
  api_key_secret = 'gemini_api_key',
  model_name = 'gemini-3.5-flash'
WHERE feature_id IN (
  SELECT id FROM public.ai_features WHERE slug = 'face_validation'
);

-- 2. Update face_analysis model_name to gemini-3.5-flash
UPDATE public.model_configs
SET
  model_name = 'gemini-3.5-flash'
WHERE feature_id IN (
  SELECT id FROM public.ai_features WHERE slug = 'face_analysis'
);

-- 3. Update ingredient_scan model_name to gemini-3.5-flash
UPDATE public.model_configs
SET
  model_name = 'gemini-3.5-flash'
WHERE feature_id IN (
  SELECT id FROM public.ai_features WHERE slug = 'ingredient_scan'
);
