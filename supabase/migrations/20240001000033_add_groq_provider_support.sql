-- ==============================================================================
-- Migration 033: Add Groq AI Provider Support
-- ==============================================================================

-- Expand provider check constraint on model_configs to include 'groq'
ALTER TABLE public.model_configs DROP CONSTRAINT IF EXISTS model_configs_provider_check;
ALTER TABLE public.model_configs ADD CONSTRAINT model_configs_provider_check
  CHECK (provider IN ('google', 'anthropic', 'openai', 'groq'));
