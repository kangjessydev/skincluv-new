-- ============================================================
-- Migration 022: Secure Coins & Missions Infrastructure
-- 1. Restrict client-side write access on coin & mission tables
-- 2. Revamp claim_mission() to be server-validated & auth-checked
-- 3. Revoke client execution on credit_coins()
-- 4. Create internal record_mission_progress() for Edge Functions
-- 5. Create verified track_daily_login() with streak calculation
-- 6. Create verified track_profile_completion()
-- ============================================================

-- 1. Ensure RLS is enabled and revoke client writes
ALTER TABLE public.coin_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

-- Drop any lingering insert/update/delete policies on coin_balances & transactions
DROP POLICY IF EXISTS "coin_balances_insert_own" ON public.coin_balances;
DROP POLICY IF EXISTS "coin_balances_update_own" ON public.coin_balances;
DROP POLICY IF EXISTS "coin_balances_delete_own" ON public.coin_balances;

DROP POLICY IF EXISTS "coin_transactions_insert_own" ON public.coin_transactions;
DROP POLICY IF EXISTS "coin_transactions_update_own" ON public.coin_transactions;
DROP POLICY IF EXISTS "coin_transactions_delete_own" ON public.coin_transactions;

DROP POLICY IF EXISTS "user_missions_insert_own" ON public.user_missions;
DROP POLICY IF EXISTS "user_missions_update_own" ON public.user_missions;
DROP POLICY IF EXISTS "user_missions_delete_own" ON public.user_missions;

-- Ensure SELECT policies exist for owner
DROP POLICY IF EXISTS "coin_balances_select_own" ON public.coin_balances;
CREATE POLICY "coin_balances_select_own" ON public.coin_balances FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "coin_transactions_select_own" ON public.coin_transactions;
CREATE POLICY "coin_transactions_select_own" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_missions_select_own" ON public.user_missions;
CREATE POLICY "user_missions_select_own" ON public.user_missions FOR SELECT USING (auth.uid() = user_id);

-- Revoke write privileges from public, anon, and authenticated
REVOKE INSERT, UPDATE, DELETE ON public.coin_balances FROM public, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.coin_transactions FROM public, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_missions FROM public, anon, authenticated;

-- Revoke credit_coins from public/authenticated (internal use only)
REVOKE EXECUTE ON FUNCTION public.credit_coins(uuid, integer, uuid, text) FROM public, anon, authenticated;

-- 2. Drop old claim_mission signatures
DROP FUNCTION IF EXISTS public.claim_mission(uuid, text, integer);
DROP FUNCTION IF EXISTS public.claim_mission(text);

-- 3. Create secure claim_mission
CREATE OR REPLACE FUNCTION public.claim_mission(p_mission_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_mission record;
  v_user_mission record;
  v_str_ref text;
  v_ref_id uuid;
  v_already_claimed boolean;
  v_new_balance integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED', 'message', 'Pengguna belum terautentikasi');
  END IF;

  -- 1. Lookup mission details directly from DB
  SELECT id, slug, name, coin_reward, target_count, type, cooldown_hours
  INTO v_mission
  FROM public.missions
  WHERE slug = p_mission_slug AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'MISSION_NOT_FOUND', 'message', 'Misi tidak ditemukan atau non-aktif');
  END IF;

  -- 2. Verify progress in user_missions
  SELECT current_count, is_completed INTO v_user_mission
  FROM public.user_missions
  WHERE user_id = v_user_id AND mission_id = v_mission.id;

  IF NOT FOUND OR v_user_mission.current_count < v_mission.target_count THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROGRESS_NOT_REACHED', 'message', 'Progres misi belum mencapai target');
  END IF;

  -- 3. Generate deterministic reference ID to prevent double-claim / race condition
  IF v_mission.type = 'daily' THEN
    v_str_ref := 'claim_' || v_mission.slug || '_' || to_char(now(), 'YYYYMMDD');
  ELSE
    v_str_ref := 'claim_' || v_mission.slug;
  END IF;
  v_ref_id := CAST(md5(v_str_ref) AS uuid);

  -- Check if already claimed
  SELECT EXISTS(
    SELECT 1 FROM public.coin_transactions
    WHERE user_id = v_user_id AND reference_id = v_ref_id
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED', 'message', 'Hadiah misi ini sudah pernah diklaim');
  END IF;

  -- 4. Mark user_mission as completed
  UPDATE public.user_missions
  SET is_completed = true, completed_at = now()
  WHERE user_id = v_user_id AND mission_id = v_mission.id;

  -- 5. Record transaction in coin_transactions
  INSERT INTO public.coin_transactions (user_id, amount, type, reference_id, notes)
  VALUES (v_user_id, v_mission.coin_reward, 'mission_reward', v_ref_id, 'Klaim hadiah misi: ' || v_mission.name);

  -- 6. Atomically update balance with row lock
  INSERT INTO public.coin_balances (user_id, balance, updated_at)
  VALUES (v_user_id, v_mission.coin_reward, now())
  ON CONFLICT (user_id)
  DO UPDATE SET balance = coin_balances.balance + v_mission.coin_reward, updated_at = now()
  RETURNING balance INTO v_new_balance;

  RETURN jsonb_build_object(
    'success', true,
    'coins_awarded', v_mission.coin_reward,
    'new_balance', v_new_balance,
    'message', 'Berhasil mengklaim ' || v_mission.coin_reward || ' koin!'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_mission(text) TO authenticated;

-- 4. Create internal record_mission_progress (for Edge Functions / service_role only)
CREATE OR REPLACE FUNCTION public.record_mission_progress(
  p_user_id uuid,
  p_action text,
  p_count integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_normalized_action text;
  v_m record;
BEGIN
  -- Normalize alias
  IF p_action = 'face_analysis' THEN
    v_normalized_action := 'face_scan';
  ELSE
    v_normalized_action := p_action;
  END IF;

  FOR v_m IN
    SELECT id, target_count, type
    FROM public.missions
    WHERE is_active = true AND (metadata->>'action' = v_normalized_action OR metadata->>'action' = p_action)
  LOOP
    INSERT INTO public.user_missions (user_id, mission_id, current_count, last_activity)
    VALUES (p_user_id, v_m.id, p_count, now())
    ON CONFLICT (user_id, mission_id)
    DO UPDATE SET
      current_count = LEAST(user_missions.current_count + p_count, v_m.target_count),
      last_activity = now()
    WHERE user_missions.is_completed = false;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_mission_progress(uuid, text, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_mission_progress(uuid, text, integer) TO service_role;

-- 5. Create verified track_daily_login with streak logic
CREATE OR REPLACE FUNCTION public.track_daily_login()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_daily_m record;
  v_streak_m record;
  v_um_count integer;
  v_um_last timestamptz;
  v_days_diff integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  -- 1. Track daily_login
  SELECT id, target_count INTO v_daily_m
  FROM public.missions WHERE slug = 'daily_login' AND is_active = true;

  IF FOUND THEN
    SELECT current_count, last_activity INTO v_um_count, v_um_last
    FROM public.user_missions
    WHERE user_id = v_user_id AND mission_id = v_daily_m.id;

    IF NOT FOUND THEN
      INSERT INTO public.user_missions (user_id, mission_id, current_count, last_activity, is_completed)
      VALUES (v_user_id, v_daily_m.id, 1, now(), false);
    ELSIF v_um_last::date < current_date THEN
      -- New day: reset progress so it can be completed and claimed today
      UPDATE public.user_missions
      SET current_count = 1,
          last_activity = now(),
          is_completed = false
      WHERE user_id = v_user_id AND mission_id = v_daily_m.id;
    END IF;
  END IF;

  -- 2. Track streak missions (e.g. streak_7_days, streak_30_days)
  FOR v_streak_m IN
    SELECT id, target_count, slug
    FROM public.missions WHERE type = 'streak' AND is_active = true
  LOOP
    SELECT current_count, last_activity INTO v_um_count, v_um_last
    FROM public.user_missions
    WHERE user_id = v_user_id AND mission_id = v_streak_m.id;

    IF NOT FOUND THEN
      INSERT INTO public.user_missions (user_id, mission_id, current_count, last_activity, is_completed)
      VALUES (v_user_id, v_streak_m.id, 1, now(), false);
    ELSE
      v_days_diff := current_date - v_um_last::date;
      IF v_days_diff = 1 THEN
        -- Logged in on consecutive day
        UPDATE public.user_missions
        SET current_count = LEAST(current_count + 1, v_streak_m.target_count),
            last_activity = now()
        WHERE user_id = v_user_id AND mission_id = v_streak_m.id;
      ELSIF v_days_diff > 1 THEN
        -- Streak broken (>1 day gap), reset to 1
        UPDATE public.user_missions
        SET current_count = 1,
            last_activity = now(),
            is_completed = false
        WHERE user_id = v_user_id AND mission_id = v_streak_m.id;
      END IF;
      -- If v_days_diff = 0, already logged in today, do nothing
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_daily_login() TO authenticated;

-- 6. Create verified track_profile_completion
CREATE OR REPLACE FUNCTION public.track_profile_completion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_prof_m record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  SELECT full_name, username, skin_type INTO v_profile
  FROM public.profiles WHERE id = v_user_id;

  IF v_profile.full_name IS NOT NULL AND trim(v_profile.full_name) != '' AND
     v_profile.username IS NOT NULL AND trim(v_profile.username) != '' AND
     v_profile.skin_type IS NOT NULL AND trim(v_profile.skin_type) != '' THEN

    SELECT id, target_count INTO v_prof_m
    FROM public.missions WHERE slug = 'complete_profile' AND is_active = true;

    IF FOUND THEN
      INSERT INTO public.user_missions (user_id, mission_id, current_count, last_activity)
      VALUES (v_user_id, v_prof_m.id, 1, now())
      ON CONFLICT (user_id, mission_id)
      DO UPDATE SET current_count = 1, last_activity = now();
    END IF;

    RETURN jsonb_build_object('success', true, 'profile_completed', true);
  END IF;

  RETURN jsonb_build_object('success', false, 'profile_completed', false, 'message', 'Profil belum lengkap');
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_profile_completion() TO authenticated;
