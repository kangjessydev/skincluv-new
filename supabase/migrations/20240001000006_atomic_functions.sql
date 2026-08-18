-- ============================================================
-- Migration 006: Atomic Deduction Postgres Functions
-- Idempotent: all functions use CREATE OR REPLACE
-- ============================================================

-- ----------------------------------------------------------------
-- deduct_quota — atomically increment used_count if below limit
-- Returns TRUE if deduction succeeded, FALSE if quota exceeded.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_quota(
  p_user_id         uuid,
  p_feature_id      uuid,
  p_subscription_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit       integer;
  v_used        integer;
  v_tier_id     uuid;
  v_period_end  timestamptz;
BEGIN
  SELECT tier_id, quota_reset_at INTO v_tier_id, v_period_end
  FROM public.subscriptions
  WHERE id = p_subscription_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT monthly_limit INTO v_limit
  FROM public.quota_configs
  WHERE tier_id = v_tier_id AND feature_id = p_feature_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_limit = -1 THEN
    INSERT INTO public.quota_usage (user_id, feature_id, subscription_id, used_count, period_start, period_end)
    VALUES (p_user_id, p_feature_id, p_subscription_id, 1, now(), v_period_end)
    ON CONFLICT (user_id, feature_id, subscription_id)
    DO UPDATE SET used_count = quota_usage.used_count + 1;
    RETURN true;
  END IF;

  SELECT used_count INTO v_used
  FROM public.quota_usage
  WHERE user_id = p_user_id
    AND feature_id = p_feature_id
    AND subscription_id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.quota_usage (user_id, feature_id, subscription_id, used_count, period_start, period_end)
    VALUES (p_user_id, p_feature_id, p_subscription_id, 1, now(), v_period_end);
    RETURN true;
  END IF;

  IF v_used >= v_limit THEN
    RETURN false;
  END IF;

  UPDATE public.quota_usage
  SET used_count = used_count + 1
  WHERE user_id = p_user_id
    AND feature_id = p_feature_id
    AND subscription_id = p_subscription_id;

  RETURN true;
END;
$$;

-- ----------------------------------------------------------------
-- deduct_coins — atomically deduct coins if balance sufficient
-- Returns TRUE if deduction succeeded, FALSE if balance insufficient.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_coins(
  p_user_id      uuid,
  p_amount       integer,
  p_reference_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be positive';
  END IF;

  SELECT balance INTO v_balance
  FROM public.coin_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND OR v_balance < p_amount THEN
    RETURN false;
  END IF;

  UPDATE public.coin_balances
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.coin_transactions (user_id, amount, type, reference_id, notes)
  VALUES (p_user_id, -p_amount, 'ai_usage', p_reference_id, 'AI feature usage');

  RETURN true;
END;
$$;

-- ----------------------------------------------------------------
-- rollback_deduction — called on AI provider error (Opsi A)
-- Reverses quota increment or coin deduction.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rollback_deduction(
  p_user_id         uuid,
  p_feature_id      uuid,
  p_subscription_id uuid,
  p_mode            text,
  p_coin_amount     integer DEFAULT NULL,
  p_coin_ref        uuid    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_mode = 'quota' THEN
    UPDATE public.quota_usage
    SET used_count = GREATEST(used_count - 1, 0)
    WHERE user_id = p_user_id
      AND feature_id = p_feature_id
      AND subscription_id = p_subscription_id;

  ELSIF p_mode = 'coin' AND p_coin_amount IS NOT NULL THEN
    UPDATE public.coin_balances
    SET balance = balance + p_coin_amount, updated_at = now()
    WHERE user_id = p_user_id;

    INSERT INTO public.coin_transactions (user_id, amount, type, reference_id, notes)
    VALUES (p_user_id, p_coin_amount, 'admin_adjustment', p_coin_ref, 'Refund: AI provider error');
  END IF;
END;
$$;

-- ----------------------------------------------------------------
-- credit_coins — atomically credit coins for mission completion
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.credit_coins(
  p_user_id    uuid,
  p_amount     integer,
  p_mission_id uuid,
  p_notes      text DEFAULT 'Mission reward'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be positive';
  END IF;

  UPDATE public.coin_balances
  SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.coin_transactions (user_id, amount, type, reference_id, notes)
  VALUES (p_user_id, p_amount, 'mission_reward', p_mission_id, p_notes);
END;
$$;
