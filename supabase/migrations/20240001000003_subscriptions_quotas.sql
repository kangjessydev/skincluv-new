-- ============================================================
-- Migration 003: Subscriptions, Quota Configs, Quota Usage
-- Idempotent: safe to re-run
-- ============================================================

-- ---- subscription_tiers ----
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text    UNIQUE NOT NULL,
  name        text    NOT NULL,
  price_idr   integer NOT NULL DEFAULT 0,
  features    jsonb   NOT NULL DEFAULT '{}',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- subscriptions ----
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier_id         uuid    NOT NULL REFERENCES public.subscription_tiers(id),
  status          text    NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  started_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,
  quota_reset_at  timestamptz NOT NULL,
  payment_ref     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_active ON public.subscriptions (user_id) WHERE status = 'active';

-- ---- quota_configs ----
CREATE TABLE IF NOT EXISTS public.quota_configs (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id       uuid    NOT NULL REFERENCES public.subscription_tiers(id) ON DELETE CASCADE,
  feature_id    uuid    NOT NULL REFERENCES public.ai_features(id) ON DELETE CASCADE,
  monthly_limit integer NOT NULL DEFAULT 100 CHECK (monthly_limit >= -1),
  updated_by    uuid    REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tier_id, feature_id)
);

-- ---- quota_usage ----
CREATE TABLE IF NOT EXISTS public.quota_usage (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature_id      uuid    NOT NULL REFERENCES public.ai_features(id) ON DELETE CASCADE,
  subscription_id uuid    NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  used_count      integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  period_start    timestamptz NOT NULL,
  period_end      timestamptz NOT NULL,
  UNIQUE (user_id, feature_id, subscription_id)
);

-- ---- Trigger: auto-create free tier subscription on new user ----
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_free_tier_id uuid;
BEGIN
  SELECT id INTO v_free_tier_id FROM public.subscription_tiers WHERE slug = 'free' LIMIT 1;
  IF v_free_tier_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, tier_id, status, quota_reset_at)
    VALUES (
      new.id,
      v_free_tier_id,
      'active',
      now() + interval '30 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_subscription ON public.profiles;
CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- ---- RLS ----
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_configs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_usage        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tiers_select_all"         ON public.subscription_tiers;
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
DROP POLICY IF EXISTS "quota_configs_select_all" ON public.quota_configs;
DROP POLICY IF EXISTS "quota_usage_select_own"   ON public.quota_usage;

CREATE POLICY "tiers_select_all"         ON public.subscription_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "subscriptions_select_own" ON public.subscriptions      FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "quota_configs_select_all" ON public.quota_configs      FOR SELECT TO authenticated USING (true);
CREATE POLICY "quota_usage_select_own"   ON public.quota_usage        FOR SELECT USING (auth.uid() = user_id);

-- ---- Seed: subscription tiers ----
INSERT INTO public.subscription_tiers (slug, name, price_idr, features) VALUES
  ('free',    'Free',    0,     '{"ai_access": false, "coin_missions": true}'),
  ('premium', 'Premium', 49000, '{"ai_access": true, "coin_missions": true, "priority_support": true}')
ON CONFLICT (slug) DO NOTHING;

-- ---- Seed: quota configs (premium tier) ----
INSERT INTO public.quota_configs (tier_id, feature_id, monthly_limit)
SELECT
  t.id,
  f.id,
  CASE f.slug
    WHEN 'face_validation' THEN 1000
    WHEN 'face_analysis'   THEN 100
    WHEN 'ingredient_scan' THEN 500
    WHEN 'chatbot'         THEN 2000
  END
FROM public.subscription_tiers t
CROSS JOIN public.ai_features f
WHERE t.slug = 'premium'
ON CONFLICT (tier_id, feature_id) DO NOTHING;

-- ---- Seed: quota configs (free tier) ----
INSERT INTO public.quota_configs (tier_id, feature_id, monthly_limit)
SELECT
  t.id,
  f.id,
  CASE f.slug
    WHEN 'face_validation' THEN 3
    WHEN 'face_analysis'   THEN 3
    WHEN 'ingredient_scan' THEN 3
    WHEN 'chatbot'         THEN 5
  END
FROM public.subscription_tiers t
CROSS JOIN public.ai_features f
WHERE t.slug = 'free'
ON CONFLICT (tier_id, feature_id) DO NOTHING;
