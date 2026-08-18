-- Migration 009: Increase max_tokens for gemini-3.6-flash reasoning models

UPDATE public.model_configs
SET parameters = jsonb_set(parameters, '{max_tokens}', '8192');
