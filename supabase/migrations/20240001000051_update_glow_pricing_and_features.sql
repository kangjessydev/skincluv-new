-- ==============================================================================
-- Migration 051: Update Glow Pricing & Universal Quota Metadata
-- ==============================================================================

UPDATE public.subscription_tiers
SET
  price_idr = 25000,
  features = '{"ai_access": true, "credit_missions": true, "monthly_quota": 100, "chatbot_tier": "standard", "universal_quota": true}'::jsonb
WHERE slug = 'glow';

UPDATE public.subscription_tiers
SET
  price_idr = 49000,
  features = '{"ai_access": true, "credit_missions": true, "monthly_quota": 500, "chatbot_tier": "expert", "priority_support": true, "deep_analysis": true, "web_search": true, "universal_quota": true}'::jsonb
WHERE slug = 'premium';
