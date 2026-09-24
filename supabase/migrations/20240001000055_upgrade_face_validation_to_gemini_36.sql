-- Migration 055: Upgrade face_validation model from deprecated gemini-2.5-flash to gemini-3.6-flash
-- Google Gemini API returned 404: "This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.6-flash"

UPDATE public.model_configs
SET
  model_name = 'gemini-3.6-flash',
  parameters = jsonb_build_object('temperature', 0.1, 'max_tokens', 250, 'thinking_budget', 0)
WHERE feature_id IN (
  SELECT id FROM public.ai_features WHERE slug = 'face_validation'
);
