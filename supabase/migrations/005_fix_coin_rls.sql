-- ============================================================
-- Migration 005: Fix RLS Policies & Stored Procedures for Coins
-- Idempotent & safe to run in Supabase SQL Editor
-- ============================================================

-- 1. Ensure RLS is enabled
ALTER TABLE public.coin_balances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions          ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "coin_balances_select_own"     ON public.coin_balances;
DROP POLICY IF EXISTS "coin_balances_insert_own"     ON public.coin_balances;
DROP POLICY IF EXISTS "coin_balances_update_own"     ON public.coin_balances;

DROP POLICY IF EXISTS "coin_transactions_select_own" ON public.coin_transactions;
DROP POLICY IF EXISTS "coin_transactions_insert_own" ON public.coin_transactions;

DROP POLICY IF EXISTS "user_missions_select_own"     ON public.user_missions;
DROP POLICY IF EXISTS "user_missions_insert_own"     ON public.user_missions;
DROP POLICY IF EXISTS "user_missions_update_own"     ON public.user_missions;

DROP POLICY IF EXISTS "missions_select_active"       ON public.missions;

-- 3. Create full RLS Policies for authenticated users
CREATE POLICY "coin_balances_select_own" ON public.coin_balances
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "coin_balances_insert_own" ON public.coin_balances
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coin_balances_update_own" ON public.coin_balances
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "coin_transactions_select_own" ON public.coin_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "coin_transactions_insert_own" ON public.coin_transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_missions_select_own" ON public.user_missions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_missions_insert_own" ON public.user_missions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_missions_update_own" ON public.user_missions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "missions_select_active" ON public.missions
  FOR SELECT TO authenticated USING (is_active = true);

-- 4. Atomic Credit Coins Function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.credit_coins(
  p_user_id    uuid,
  p_amount     integer,
  p_mission_id uuid    DEFAULT NULL,
  p_notes      text    DEFAULT 'Mission reward'
)
RETURNS public.coin_balances
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_result public.coin_balances;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be positive';
  END IF;

  -- Upsert coin balance
  INSERT INTO public.coin_balances (user_id, balance, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id) DO UPDATE
  SET balance = public.coin_balances.balance + EXCLUDED.balance,
      updated_at = now()
  RETURNING * INTO v_result;

  -- Log transaction
  INSERT INTO public.coin_transactions (user_id, amount, type, reference_id, notes, created_at)
  VALUES (p_user_id, p_amount, 'mission_reward', p_mission_id, p_notes, now());

  RETURN v_result;
END;
$$;
