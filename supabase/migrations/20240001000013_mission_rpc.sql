-- ============================================================
-- Migration 011: Mission Claim RPC
-- ============================================================

CREATE OR REPLACE FUNCTION claim_mission(
  p_user_id uuid,
  p_mission_slug text,
  p_reward_coins int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_ref_id text;
  v_already_claimed boolean;
BEGIN
  -- Generate a unique reference ID for this claim based on the mission type
  IF p_mission_slug = 'daily_login' THEN
    -- Only one claim per day
    v_ref_id := 'mission_' || p_mission_slug || '_' || to_char(now(), 'YYYYMMDD');
  ELSE
    -- One time claim
    v_ref_id := 'mission_' || p_mission_slug;
  END IF;

  -- Check if already claimed
  SELECT EXISTS(
    SELECT 1 FROM public.coin_transactions
    WHERE user_id = p_user_id AND reference_id = v_ref_id
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN false;
  END IF;

  -- Insert transaction
  INSERT INTO public.coin_transactions (user_id, amount, type, reference_id, notes)
  VALUES (p_user_id, p_reward_coins, 'mission_reward', v_ref_id, 'Claimed mission: ' || p_mission_slug);

  -- Update balance
  INSERT INTO public.coin_balances (user_id, balance)
  VALUES (p_user_id, p_reward_coins)
  ON CONFLICT (user_id) 
  DO UPDATE SET balance = coin_balances.balance + p_reward_coins;

  RETURN true;
END;
$$;
