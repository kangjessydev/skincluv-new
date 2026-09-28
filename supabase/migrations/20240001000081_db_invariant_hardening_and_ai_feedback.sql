-- ==============================================================================
-- Migration 081: Database Invariant Hardening & AI Feedback Ledger (RFC 017)
-- 1. Lock Invariant 2: face_validation credit_cost must always be 0
-- 2. Lock Invariant 1: universal_ai must always remain is_active = true
-- 3. Dedicated immutable feedback table: public.ai_feedback (Zero bloat on ai_request_logs)
-- 4. Atomic RPC: public.record_ai_feedback
-- ==============================================================================

-- 1. Lock Invariant 2 (face_validation 0-credit gatekeeper)
ALTER TABLE public.ai_features
  DROP CONSTRAINT IF EXISTS chk_face_validation_zero_cost;

ALTER TABLE public.ai_features
  ADD CONSTRAINT chk_face_validation_zero_cost
  CHECK (slug != 'face_validation' OR credit_cost = 0);

-- 2. Lock Invariant 1 (universal_ai subscription quota anchor)
ALTER TABLE public.ai_features
  DROP CONSTRAINT IF EXISTS chk_universal_ai_active;

ALTER TABLE public.ai_features
  ADD CONSTRAINT chk_universal_ai_active
  CHECK (slug != 'universal_ai' OR is_active = true);

-- 3. Create dedicated ai_feedback table
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id      uuid NOT NULL REFERENCES public.ai_request_logs(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback    smallint NOT NULL CHECK (feedback IN (-1, 0, 1)),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_ai_feedback_log_user UNIQUE (log_id, user_id)
);

-- Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_ai_feedback_log_id ON public.ai_feedback (log_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_created ON public.ai_feedback (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own feedback" ON public.ai_feedback;
CREATE POLICY "Users can manage own feedback" ON public.ai_feedback
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all feedback" ON public.ai_feedback;
CREATE POLICY "Admins can view all feedback" ON public.ai_feedback
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- 4. Atomic RPC: record_ai_feedback
CREATE OR REPLACE FUNCTION public.record_ai_feedback(
  p_log_id uuid,
  p_feedback smallint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_log_exists boolean;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User not authenticated';
  END IF;

  IF p_feedback NOT IN (-1, 0, 1) THEN
    RAISE EXCEPTION 'Invalid feedback value: must be -1, 0, or 1';
  END IF;

  -- Verify that the log belongs to this user
  SELECT EXISTS (
    SELECT 1 FROM public.ai_request_logs
    WHERE id = p_log_id AND user_id = v_uid
  ) INTO v_log_exists;

  IF NOT v_log_exists THEN
    RAISE EXCEPTION 'Target AI log does not exist or does not belong to the authenticated user';
  END IF;

  -- Upsert feedback
  INSERT INTO public.ai_feedback (log_id, user_id, feedback, created_at)
  VALUES (p_log_id, v_uid, p_feedback, now())
  ON CONFLICT (log_id, user_id) DO UPDATE
  SET feedback = EXCLUDED.feedback,
      created_at = now();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_ai_feedback(uuid, smallint) TO authenticated;
