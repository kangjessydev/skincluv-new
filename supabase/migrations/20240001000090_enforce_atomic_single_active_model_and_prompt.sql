-- ==============================================================================
-- Migration: 20240001000090_enforce_atomic_single_active_model_and_prompt.sql
-- Description:
-- Enforces atomic single-active exclusivity for:
-- 1. public.model_configs per feature_id (only 1 active model per task/function)
-- 2. public.prompt_versions per feature_id (only 1 active prompt per task/function)
-- Whenever any record is inserted or updated with is_active = true, all other
-- records sharing the same feature_id are automatically set to is_active = false.
-- ==============================================================================

-- 1. Trigger function for model_configs
CREATE OR REPLACE FUNCTION public.fn_enforce_single_active_model_config()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Deactivate all other model configurations for the same AI feature
    UPDATE public.model_configs
    SET is_active = false
    WHERE feature_id = NEW.feature_id
      AND id <> NEW.id
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_single_active_model_config ON public.model_configs;
CREATE TRIGGER trg_enforce_single_active_model_config
  BEFORE INSERT OR UPDATE OF is_active, feature_id
  ON public.model_configs
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.fn_enforce_single_active_model_config();

-- 2. Trigger function for prompt_versions
CREATE OR REPLACE FUNCTION public.fn_enforce_single_active_prompt_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Deactivate all other prompt versions for the same AI feature
    UPDATE public.prompt_versions
    SET is_active = false
    WHERE feature_id = NEW.feature_id
      AND id <> NEW.id
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_single_active_prompt_version ON public.prompt_versions;
CREATE TRIGGER trg_enforce_single_active_prompt_version
  BEFORE INSERT OR UPDATE OF is_active, feature_id
  ON public.prompt_versions
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.fn_enforce_single_active_prompt_version();
