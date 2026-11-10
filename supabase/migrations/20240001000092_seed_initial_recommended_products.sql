-- ==============================================================================
-- Migration: 20240001000092_seed_initial_recommended_products.sql
-- Description:
-- Seeds initial verified catalog products in public.products so that
-- Face Scan AI Product Recommendations and Admin Products Page have a live,
-- real baseline of popular skincare items.
-- ==============================================================================

INSERT INTO public.products (
  name,
  brand,
  category,
  key_ingredients,
  skin_type_fit,
  price_estimate,
  marketplace_url,
  listing_type,
  sponsor_weight,
  is_active
)
VALUES
  (
    'Calm Down! Skinpair Barrier Serum',
    'Somethinc',
    'Serum',
    ARRAY['Centella Asiatica', 'Panthenol', 'Ceramide', 'Allantoin'],
    ARRAY['all', 'sensitive', 'dry', 'oily', 'combination'],
    'Rp 119.000',
    'https://shopee.co.id',
    'organic',
    0,
    true
  ),
  (
    '5X Ceramide Barrier Repair Moisture Gel',
    'Skintific',
    'Moisturizer',
    ARRAY['Ceramide', 'Hyaluronic Acid', 'Centella Asiatica', 'Panthenol'],
    ARRAY['all', 'dry', 'sensitive', 'combination'],
    'Rp 139.000',
    'https://shopee.co.id',
    'organic',
    0,
    true
  ),
  (
    'Miraculous Refining Serum',
    'Avoskin',
    'Serum',
    ARRAY['Salicylic Acid', 'Glycolic Acid', 'Niacinamide', 'Ceramide'],
    ARRAY['oily', 'acne', 'combination'],
    'Rp 149.000',
    'https://shopee.co.id',
    'organic',
    0,
    true
  ),
  (
    '5% Niacinamide + Moisture Sabi Beet Serum',
    'Somethinc',
    'Serum',
    ARRAY['Niacinamide', 'Centella Asiatica', 'Allantoin', 'Aqua'],
    ARRAY['all', 'oily', 'combination', 'normal'],
    'Rp 89.000',
    'https://shopee.co.id',
    'organic',
    0,
    true
  ),
  (
    'Hydrasoothe Sunscreen Gel SPF 45 PA++++',
    'Azarine',
    'Sunscreen',
    ARRAY['Aloe Vera', 'Centella Asiatica', 'Propolis', 'Niacinamide'],
    ARRAY['all', 'oily', 'acne', 'combination', 'sensitive'],
    'Rp 65.000',
    'https://shopee.co.id',
    'organic',
    0,
    true
  ),
  (
    'Mugwort Cica Soothing Toner',
    'True to Skin',
    'Toner',
    ARRAY['Mugwort', 'Centella Asiatica', 'Salicylic Acid', 'Panthenol'],
    ARRAY['oily', 'acne', 'sensitive', 'combination'],
    'Rp 109.000',
    'https://shopee.co.id',
    'organic',
    0,
    true
  ),
  (
    'Centella Allantoin Soothing Gel Moisturizer',
    'Glad2Glow',
    'Moisturizer',
    ARRAY['Centella Asiatica', 'Allantoin', 'Panthenol', 'Glycerin'],
    ARRAY['oily', 'acne', 'sensitive', 'combination'],
    'Rp 45.000',
    'https://shopee.co.id',
    'organic',
    0,
    true
  ),
  (
    'UV Shield Essential Gel Sunscreen SPF 35 PA+++',
    'Wardah',
    'Sunscreen',
    ARRAY['Allantoin', 'Vitamin E', 'Aqua', 'Glycerin'],
    ARRAY['all', 'normal', 'dry', 'combination'],
    'Rp 38.000',
    'https://shopee.co.id',
    'organic',
    0,
    true
  )
ON CONFLICT DO NOTHING;
