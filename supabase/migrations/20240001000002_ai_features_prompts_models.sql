-- ============================================================
-- Migration 002: AI Features, Prompt Versions, Model Configs
-- Idempotent: safe to re-run
-- ============================================================

-- ---- ai_features ----
CREATE TABLE IF NOT EXISTS public.ai_features (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text    UNIQUE NOT NULL,
  name        text    NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- prompt_versions ----
CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id    uuid    NOT NULL REFERENCES public.ai_features(id) ON DELETE CASCADE,
  version       integer NOT NULL,
  system_prompt text    NOT NULL,
  user_prompt   text,
  notes         text,
  is_active     boolean NOT NULL DEFAULT false,
  created_by    uuid    REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (feature_id, version)
);

-- ---- model_configs ----
CREATE TABLE IF NOT EXISTS public.model_configs (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id     uuid    NOT NULL REFERENCES public.ai_features(id) ON DELETE CASCADE,
  provider       text    NOT NULL CHECK (provider IN ('google', 'anthropic', 'openai')),
  model_name     text    NOT NULL,
  api_key_secret text    NOT NULL,
  parameters     jsonb   NOT NULL DEFAULT '{"temperature": 0.7, "max_tokens": 1024}',
  is_active      boolean NOT NULL DEFAULT false,
  notes          text,
  created_by     uuid    REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---- Trigger: enforce only one active prompt per feature ----
CREATE OR REPLACE FUNCTION public.enforce_single_active_prompt()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.prompt_versions
    SET is_active = false
    WHERE feature_id = NEW.feature_id
      AND id != NEW.id
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prompt_versions_single_active ON public.prompt_versions;
CREATE TRIGGER prompt_versions_single_active
  BEFORE INSERT OR UPDATE ON public.prompt_versions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_active_prompt();

-- ---- Trigger: enforce only one active model config per feature ----
CREATE OR REPLACE FUNCTION public.enforce_single_active_model()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.model_configs
    SET is_active = false
    WHERE feature_id = NEW.feature_id
      AND id != NEW.id
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS model_configs_single_active ON public.model_configs;
CREATE TRIGGER model_configs_single_active
  BEFORE INSERT OR UPDATE ON public.model_configs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_active_model();

-- ---- Auto-increment version per feature ----
CREATE OR REPLACE FUNCTION public.set_prompt_version_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1
    INTO NEW.version
  FROM public.prompt_versions
  WHERE feature_id = NEW.feature_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prompt_versions_auto_version ON public.prompt_versions;
CREATE TRIGGER prompt_versions_auto_version
  BEFORE INSERT ON public.prompt_versions
  FOR EACH ROW EXECUTE FUNCTION public.set_prompt_version_number();

-- ---- RLS ----
ALTER TABLE public.ai_features     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_configs   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_features_select_all"     ON public.ai_features;
DROP POLICY IF EXISTS "prompt_versions_select_all" ON public.prompt_versions;
DROP POLICY IF EXISTS "model_configs_select_all"   ON public.model_configs;

CREATE POLICY "ai_features_select_all"     ON public.ai_features     FOR SELECT TO authenticated USING (true);
CREATE POLICY "prompt_versions_select_all" ON public.prompt_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "model_configs_select_all"   ON public.model_configs   FOR SELECT TO authenticated USING (true);

-- ---- Seed: 4 core AI features ----
INSERT INTO public.ai_features (slug, name, description) VALUES
  ('face_validation', 'Face Validation', 'Validates whether the uploaded image clearly shows a human face'),
  ('face_analysis',   'Face Analysis',   'Analyzes skin type and conditions from a face image'),
  ('ingredient_scan', 'Ingredient Scan', 'Analyzes product ingredients for compatibility with user skin profile'),
  ('chatbot',         'Skin Care Chatbot','General skin care advice chatbot with user skin profile context')
ON CONFLICT (slug) DO NOTHING;
