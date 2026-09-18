-- ============================================================
-- Migration 041: Set Per-Feature Thinking Budget in model_configs
--
-- Explicitly configure thinking_budget: 0 for ingredient_scan and face_validation
-- (pure OCR and fast verification tasks), eliminating the ~15s CoT reasoning delay.
-- Face_analysis and chatbot retain full native Gemini reasoning (no thinking_budget set).
-- ============================================================

-- 1. Set thinking_budget = 0 for ingredient_scan and face_validation (Google models)
UPDATE public.model_configs
SET parameters = jsonb_set(
  COALESCE(parameters, '{}'::jsonb),
  '{thinking_budget}',
  '0'::jsonb,
  true
)
WHERE feature_id IN (
  SELECT id FROM public.ai_features WHERE slug IN ('ingredient_scan', 'face_validation')
)
AND provider = 'google';

-- 2. Remove thinking_budget if present on face_analysis or chatbot so full native reasoning is preserved
UPDATE public.model_configs
SET parameters = parameters - 'thinking_budget'
WHERE feature_id IN (
  SELECT id FROM public.ai_features WHERE slug IN ('face_analysis', 'chatbot')
)
AND parameters ? 'thinking_budget';
