-- ==============================================================================
-- Migration 083: Update Tier Original Prices for Promo Discount Display
-- 1. Set original_price_idr so UI calculates and displays strikethrough discount:
--    - Glow: Rp 50.000 (Coret) -> Rp 25.000 (Hemat 50%)
--    - Pro:  Rp 99.000 (Coret) -> Rp 49.000 (Hemat 51%)
-- 2. Compliant with Invariant 18 (Pricing Integrity & Non-Derived Invoice Billing)
-- ==============================================================================

UPDATE public.subscription_tiers
SET
  original_price_idr = 50000,
  promo_badge = 'Ramah Kantong'
WHERE slug = 'glow';

UPDATE public.subscription_tiers
SET
  original_price_idr = 99000,
  promo_badge = 'Rekomendasi Utama'
WHERE slug = 'premium';
