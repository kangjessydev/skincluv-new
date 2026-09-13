-- ============================================================
-- Migration 024: Tiered Pricing, Quotas & AI Credit Rewards
-- 1. Adds 'glow' tier (Rp 19.000) & updates 'premium' tier (Rp 49.000)
-- 2. Sets universal quota configs:
--    - Free: 0 (must use credits from missions)
--    - Glow: 100 uses/month
--    - Premium: 500 uses/month (unlimited FUP feel)
-- 3. Adjusts missions reward values to match the new Credit economy
-- ============================================================

-- 1. Insert or update subscription tiers
INSERT INTO public.subscription_tiers (slug, name, price_idr, features, is_active)
VALUES 
  ('glow', 'Glow', 19000, '{"ai_access": true, "credit_missions": true, "monthly_quota": 100, "chatbot_tier": "standard"}', true)
ON CONFLICT (slug) 
DO UPDATE SET 
  name = 'Glow',
  price_idr = 19000,
  features = '{"ai_access": true, "credit_missions": true, "monthly_quota": 100, "chatbot_tier": "standard"}',
  is_active = true;

UPDATE public.subscription_tiers
SET 
  name = 'Pro',
  price_idr = 49000,
  features = '{"ai_access": true, "credit_missions": true, "monthly_quota": 500, "chatbot_tier": "expert", "priority_support": true, "deep_analysis": true}',
  is_active = true
WHERE slug = 'premium';

UPDATE public.subscription_tiers
SET 
  name = 'Free',
  price_idr = 0,
  features = '{"ai_access": false, "credit_missions": true, "monthly_quota": 0}',
  is_active = true
WHERE slug = 'free';

-- 2. Configure Universal Quota limits
DO $$
DECLARE
  v_free_id uuid;
  v_glow_id uuid;
  v_premium_id uuid;
  v_univ_id uuid;
BEGIN
  SELECT id INTO v_free_id FROM public.subscription_tiers WHERE slug = 'free';
  SELECT id INTO v_glow_id FROM public.subscription_tiers WHERE slug = 'glow';
  SELECT id INTO v_premium_id FROM public.subscription_tiers WHERE slug = 'premium';
  SELECT id INTO v_univ_id FROM public.ai_features WHERE slug = 'universal_ai';

  IF v_univ_id IS NOT NULL THEN
    -- Free tier: 0 quota (must use credits earned via missions or upgrade)
    IF v_free_id IS NOT NULL THEN
      INSERT INTO public.quota_configs (tier_id, feature_id, monthly_limit)
      VALUES (v_free_id, v_univ_id, 0)
      ON CONFLICT (tier_id, feature_id)
      DO UPDATE SET monthly_limit = 0, updated_at = now();
    END IF;

    -- Glow tier: 100 universal uses / month
    IF v_glow_id IS NOT NULL THEN
      INSERT INTO public.quota_configs (tier_id, feature_id, monthly_limit)
      VALUES (v_glow_id, v_univ_id, 100)
      ON CONFLICT (tier_id, feature_id)
      DO UPDATE SET monthly_limit = 100, updated_at = now();
    END IF;

    -- Premium (Pro) tier: 500 universal uses / month (FUP Unlimited)
    IF v_premium_id IS NOT NULL THEN
      INSERT INTO public.quota_configs (tier_id, feature_id, monthly_limit)
      VALUES (v_premium_id, v_univ_id, 500)
      ON CONFLICT (tier_id, feature_id)
      DO UPDATE SET monthly_limit = 500, updated_at = now();
    END IF;
  END IF;
END;
$$;

-- 3. Adjust mission rewards to align with the new Credit scale
UPDATE public.missions SET coin_reward = 2   WHERE slug = 'daily_login';
UPDATE public.missions SET coin_reward = 3   WHERE slug = 'daily_face_scan';
UPDATE public.missions SET coin_reward = 10  WHERE slug = 'weekly_3_scans';
UPDATE public.missions SET coin_reward = 8   WHERE slug = 'weekly_ingredient';
UPDATE public.missions SET coin_reward = 15  WHERE slug = 'first_scan';
UPDATE public.missions SET coin_reward = 10  WHERE slug = 'complete_profile';
UPDATE public.missions SET coin_reward = 10  WHERE slug = 'first_ingredient';
UPDATE public.missions SET coin_reward = 25  WHERE slug = 'streak_7_days';
UPDATE public.missions SET coin_reward = 100 WHERE slug = 'streak_30_days';
UPDATE public.missions SET coin_reward = 15  WHERE slug = 'referral_first';
UPDATE public.missions SET coin_reward = 50  WHERE slug = 'referral_3_friends';
