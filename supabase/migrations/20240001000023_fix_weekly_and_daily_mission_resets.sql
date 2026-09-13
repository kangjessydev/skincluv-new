-- ============================================================
-- Migration 20240001000023: Fix Weekly and Daily Mission Resets
-- 1. Updates claim_mission to support weekly dedup hash (ISO week)
-- 2. Automatically resets expired daily & weekly missions in
--    claim_mission and record_mission_progress
-- ============================================================

-- 1. Update claim_mission with weekly & daily period reset + weekly dedup hash
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
  v_is_expired boolean;
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

  -- 2. Lookup user progress
  SELECT current_count, is_completed, completed_at, last_activity
  INTO v_user_mission
  FROM public.user_missions
  WHERE user_id = v_user_id AND mission_id = v_mission.id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROGRESS_NOT_REACHED', 'message', 'Progres misi belum dimulai');
  END IF;

  -- 3. Check if previous period has expired for daily or weekly missions
  v_is_expired := false;
  IF v_mission.type = 'daily' THEN
    IF (v_user_mission.last_activity::date < current_date) OR
       (v_user_mission.completed_at IS NOT NULL AND v_user_mission.completed_at::date < current_date) THEN
      v_is_expired := true;
    END IF;
  ELSIF v_mission.type = 'weekly' THEN
    IF (to_char(COALESCE(v_user_mission.completed_at, v_user_mission.last_activity), 'IYYY_IW') <> to_char(now(), 'IYYY_IW')) OR
       (v_user_mission.completed_at IS NOT NULL AND now() >= v_user_mission.completed_at + (COALESCE(v_mission.cooldown_hours, 144) || ' hours')::interval) THEN
      v_is_expired := true;
    END IF;
  END IF;

  -- If expired, reset progress for this period
  IF v_is_expired THEN
    UPDATE public.user_missions
    SET current_count = 0,
        is_completed = false,
        completed_at = NULL,
        last_activity = now()
    WHERE user_id = v_user_id AND mission_id = v_mission.id;

    RETURN jsonb_build_object('success', false, 'error', 'PROGRESS_NOT_REACHED', 'message', 'Periode misi telah berganti. Silakan selesaikan target misi periode ini.');
  END IF;

  -- 4. Verify target count reached
  IF v_user_mission.current_count < v_mission.target_count THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROGRESS_NOT_REACHED', 'message', 'Progres misi belum mencapai target');
  END IF;

  -- 5. Generate deterministic reference ID to prevent double-claim / race condition
  IF v_mission.type = 'daily' THEN
    v_str_ref := 'claim_' || v_mission.slug || '_' || to_char(now(), 'YYYYMMDD');
  ELSIF v_mission.type = 'weekly' THEN
    v_str_ref := 'claim_' || v_mission.slug || '_' || to_char(now(), 'IYYY"W"IW');
  ELSE
    v_str_ref := 'claim_' || v_mission.slug;
  END IF;
  v_ref_id := CAST(md5(v_str_ref) AS uuid);

  -- Check if already claimed for this period
  SELECT EXISTS(
    SELECT 1 FROM public.coin_transactions
    WHERE user_id = v_user_id AND reference_id = v_ref_id
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED', 'message', 'Hadiah misi ini sudah pernah diklaim untuk periode ini');
  END IF;

  -- 6. Mark user_mission as completed
  UPDATE public.user_missions
  SET is_completed = true, completed_at = now()
  WHERE user_id = v_user_id AND mission_id = v_mission.id;

  -- 7. Record transaction in coin_transactions
  INSERT INTO public.coin_transactions (user_id, amount, type, reference_id, notes)
  VALUES (v_user_id, v_mission.coin_reward, 'mission_reward', v_ref_id, 'Klaim hadiah misi: ' || v_mission.name);

  -- 8. Atomically update balance with row lock
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

-- 2. Update record_mission_progress to reset expired daily & weekly missions before incrementing
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
  v_um record;
  v_is_expired boolean;
BEGIN
  -- Normalize alias
  IF p_action = 'face_analysis' THEN
    v_normalized_action := 'face_scan';
  ELSE
    v_normalized_action := p_action;
  END IF;

  FOR v_m IN
    SELECT id, target_count, type, cooldown_hours
    FROM public.missions
    WHERE is_active = true AND (metadata->>'action' = v_normalized_action OR metadata->>'action' = p_action)
  LOOP
    -- Check existing progress
    SELECT current_count, is_completed, completed_at, last_activity
    INTO v_um
    FROM public.user_missions
    WHERE user_id = p_user_id AND mission_id = v_m.id;

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

      IF v_is_expired THEN
        -- Reset and count current action as new progress
        UPDATE public.user_missions
        SET current_count = LEAST(p_count, v_m.target_count),
            is_completed = false,
            completed_at = NULL,
            last_activity = now()
        WHERE user_id = p_user_id AND mission_id = v_m.id;
      ELSIF v_um.is_completed = false THEN
        -- Still in active period and not yet completed: increment progress
        UPDATE public.user_missions
        SET current_count = LEAST(v_um.current_count + p_count, v_m.target_count),
            last_activity = now()
        WHERE user_id = p_user_id AND mission_id = v_m.id;
      END IF;
    ELSE
      -- First time progress
      INSERT INTO public.user_missions (user_id, mission_id, current_count, last_activity, is_completed)
      VALUES (p_user_id, v_m.id, LEAST(p_count, v_m.target_count), now(), false);
    END IF;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_mission_progress(uuid, text, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_mission_progress(uuid, text, integer) TO service_role;
