-- Migration 054: Secure Mission Progress Anti-Abuse & Idempotency
-- RFC 005 AI Council: ChatGPT Security Red Team & DeepSeek Tokenomics

-- 1. Create table for mission event tracking & idempotency
CREATE TABLE IF NOT EXISTS public.mission_progress_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  reference_id text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT uq_user_action_reference UNIQUE (user_id, action, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_mpe_user_action ON public.mission_progress_events (user_id, action, created_at DESC);

-- Enable RLS for service_role only
ALTER TABLE public.mission_progress_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manages mission progress events" ON public.mission_progress_events;
CREATE POLICY "Service role manages mission progress events" ON public.mission_progress_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Drop existing overload if signature differs, and recreate robust record_mission_progress
CREATE OR REPLACE FUNCTION public.record_mission_progress(
  p_user_id uuid,
  p_action text,
  p_count integer DEFAULT 1,
  p_reference_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_normalized_action text;
  v_m record;
  v_um record;
  v_is_expired boolean;
  v_updated boolean := false;
BEGIN
  -- Normalize alias
  IF p_action = 'face_analysis' THEN
    v_normalized_action := 'face_scan';
  ELSE
    v_normalized_action := p_action;
  END IF;

  -- 1. Idempotency Check: if reference_id provided, ensure not replayed
  IF p_reference_id IS NOT NULL AND trim(p_reference_id) <> '' THEN
    INSERT INTO public.mission_progress_events (user_id, action, reference_id)
    VALUES (p_user_id, v_normalized_action, p_reference_id)
    ON CONFLICT (user_id, action, reference_id) DO NOTHING;

    IF NOT FOUND THEN
      -- Already recorded with this reference_id, return idempotent no-op
      RETURN jsonb_build_object('success', true, 'status', 'idempotent_no_op');
    END IF;
  END IF;

  FOR v_m IN
    SELECT id, target_count, type, cooldown_hours
    FROM public.missions
    WHERE is_active = true AND (metadata->>'action' = v_normalized_action OR metadata->>'action' = p_action)
  LOOP
    -- Check existing progress with row locking
    SELECT current_count, is_completed, completed_at, last_activity
    INTO v_um
    FROM public.user_missions
    WHERE user_id = p_user_id AND mission_id = v_m.id
    FOR UPDATE;

    IF FOUND THEN
      -- Determine if period has expired
      v_is_expired := false;
      IF v_m.type = 'daily' THEN
        IF (v_um.last_activity::date < current_date) OR
           (v_um.completed_at IS NOT NULL AND v_um.completed_at::date < current_date) THEN
          v_is_expired := true;
        END IF;
      ELSIF v_m.type = 'weekly' THEN
        IF (to_char(COALESCE(v_um.completed_at, v_um.last_activity), 'IYYY_IW') <> to_char(now(), 'IYYY_IW')) OR
           (v_um.completed_at IS NOT NULL AND now() >= v_um.completed_at + (COALESCE(v_m.cooldown_hours, 144) || ' hours')::interval) THEN
          v_is_expired := true;
        END IF;
      END IF;

      -- Anti-Abuse Cooldown: For chatbot, enforce minimum 60s between eligible interactions
      IF v_normalized_action = 'chatbot' AND NOT v_is_expired AND v_um.last_activity IS NOT NULL THEN
        IF (now() - v_um.last_activity) < interval '60 seconds' THEN
          -- Cooldown active, skip progress increment to prevent spamming
          CONTINUE;
        END IF;
      END IF;

      IF v_is_expired THEN
        -- Reset and count current action as new progress
        UPDATE public.user_missions
        SET current_count = LEAST(p_count, v_m.target_count),
            is_completed = false,
            completed_at = NULL,
            last_activity = now()
        WHERE user_id = p_user_id AND mission_id = v_m.id;
        v_updated := true;
      ELSIF v_um.is_completed = false THEN
        -- Still in active period and not yet completed: increment progress
        UPDATE public.user_missions
        SET current_count = LEAST(v_um.current_count + p_count, v_m.target_count),
            last_activity = now()
        WHERE user_id = p_user_id AND mission_id = v_m.id;
        v_updated := true;
      END IF;
    ELSE
      -- First time progress
      INSERT INTO public.user_missions (user_id, mission_id, current_count, last_activity, is_completed)
      VALUES (p_user_id, v_m.id, LEAST(p_count, v_m.target_count), now(), false);
      v_updated := true;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'updated', v_updated);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_mission_progress(uuid, text, integer, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_mission_progress(uuid, text, integer, text) TO service_role;
