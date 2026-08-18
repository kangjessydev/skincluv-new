-- ============================================================
-- Migration 014: Pivot to Universal Quota
-- ============================================================

-- 1. Insert universal feature
INSERT INTO public.ai_features (slug, name, description) 
VALUES ('universal_ai', 'Universal AI Usage', 'Quota for all AI features combined')
ON CONFLICT (slug) DO NOTHING;

-- 2. Clear old specific quota configs
DELETE FROM public.quota_configs;

-- 3. Insert new universal quota configs
DO $$
DECLARE
  v_free_id uuid;
  v_premium_id uuid;
  v_univ_id uuid;
BEGIN
  SELECT id INTO v_free_id FROM public.subscription_tiers WHERE slug = 'free';
  SELECT id INTO v_premium_id FROM public.subscription_tiers WHERE slug = 'premium';
  SELECT id INTO v_univ_id FROM public.ai_features WHERE slug = 'universal_ai';

  IF v_univ_id IS NOT NULL THEN
    -- Free gets 10 total AI usages per month
    IF v_free_id IS NOT NULL THEN
      INSERT INTO public.quota_configs (tier_id, feature_id, monthly_limit)
      VALUES (v_free_id, v_univ_id, 10);
    END IF;

    -- Premium gets 3000 total AI usages per month
    IF v_premium_id IS NOT NULL THEN
      INSERT INTO public.quota_configs (tier_id, feature_id, monthly_limit)
      VALUES (v_premium_id, v_univ_id, 3000);
    END IF;
  END IF;
END;
$$;
