-- Migration 052: Enable Gemini Native Structured JSON (response_mime_type = application/json)
-- Ensures Google Gemini models output pure, guaranteed valid JSON without markdown wrapping.

UPDATE model_configs
SET parameters = parameters || '{"response_mime_type": "application/json"}'::jsonb
WHERE provider = 'google'
  AND feature_id IN (
    SELECT id FROM ai_features WHERE slug IN ('ingredient_scan', 'face_analysis', 'face_validation')
  );
