-- ==============================================================================
-- Migration 084: Invariant 1 & 2 Deletion Guard on public.ai_features
-- Protects against accidental DELETE of virtual anchor 'universal_ai'
-- and 0-credit gatekeeper 'face_validation' (RFC 017 & AI Council Protocol)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.prevent_core_ai_features_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.slug IN ('universal_ai', 'face_validation') THEN
    RAISE EXCEPTION 'Invariant Violation: Cannot delete protected core feature %', OLD.slug;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_core_ai_features_delete ON public.ai_features;
CREATE TRIGGER trg_prevent_core_ai_features_delete
  BEFORE DELETE ON public.ai_features
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_core_ai_features_deletion();
