-- Migration 042: Split input/output tokens & configure face_validation gate
-- 1. Add input_tokens and output_tokens columns to ai_request_logs
ALTER TABLE public.ai_request_logs
ADD COLUMN IF NOT EXISTS input_tokens integer,
ADD COLUMN IF NOT EXISTS output_tokens integer;

-- 2. Configure face_validation as a free (0 credits) validation gate
UPDATE public.ai_features
SET credit_cost = 0
WHERE slug = 'face_validation';

-- 3. Deactivate old prompts and insert ultra-fast prompt for face_validation
UPDATE public.prompt_versions
SET is_active = false
WHERE feature_id = (SELECT id FROM public.ai_features WHERE slug = 'face_validation');

INSERT INTO public.prompt_versions (feature_id, system_prompt, notes, is_active)
SELECT
  f.id,
  'You are an ultra-fast, strict face validation engine. Your ONLY duty is to verify if the uploaded image contains a clear human face suitable for dermatological skin analysis.

Respond ONLY with valid JSON in this exact structure:
{
  "is_valid_face": true,
  "reason": "Wajah manusia terdeteksi dengan jelas dan siap dianalisis.",
  "confidence": 0.95
}

Validation Criteria:
- "is_valid_face": true ONLY IF: a clear, unobstructed human face is visible, frontal or slight angle, well-lit, and suitable for skin pore/texture inspection.
- "is_valid_face": false IF: non-human objects, pets/animals, skincare packaging/bottles, anime/illustrations, extreme digital filters, heavy blur, sunglasses/masks covering key features, or overly dark/underexposed lighting.
- "reason": concise explanation in Indonesian (max 15 words) explaining why it passed or failed.
- "confidence": number between 0.0 and 1.0.
- Output pure JSON only. Do NOT output markdown ticks, backticks, or additional text.',
  'v2 - ultra-fast JSON face gate (0 credits)',
  true
FROM public.ai_features f
WHERE f.slug = 'face_validation';

-- 4. Set model_config for face_validation to fast Gemini Flash with thinking_budget = 0
DO $$
DECLARE
  v_feat_id uuid;
BEGIN
  SELECT id INTO v_feat_id FROM public.ai_features WHERE slug = 'face_validation';
  IF v_feat_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.model_configs WHERE feature_id = v_feat_id) THEN
      UPDATE public.model_configs
      SET
        model_name = 'gemini-2.5-flash',
        provider = 'google',
        api_key_secret = 'gemini',
        parameters = jsonb_build_object('temperature', 0.1, 'max_tokens', 250, 'thinking_budget', 0),
        is_active = true
      WHERE feature_id = v_feat_id;
    ELSE
      INSERT INTO public.model_configs (feature_id, provider, model_name, api_key_secret, parameters, is_active)
      VALUES (v_feat_id, 'google', 'gemini-2.5-flash', 'gemini', jsonb_build_object('temperature', 0.1, 'max_tokens', 250, 'thinking_budget', 0), true);
    END IF;
  END IF;
END $$;
