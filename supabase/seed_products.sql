-- ============================================================
-- Template Seeding: Katalog Produk (public.products)
-- STATUS: DRAFT / PANDUAN VERIFIKASI DATA ASLI
-- 
-- CATATAN PENTING:
-- Sesuai guardrail anti-halusinasi, jangan jalankan file ini sebelum
-- komposisi 'key_ingredients' diverifikasi dari kemasan fisik / official store,
-- dan 'marketplace_url' diisi URL produk spesifik (bukan domain umum).
-- ============================================================

-- Catatan Review Khusus:
-- 1. [PRIORITAS TINGGI] Somethinc Granactive Retinoid 2%: Gunakan 'Granactive Retinoid' / 'Hydroxypinacolone Retinoate', JANGAN campur dengan 'Retinol'.
-- 2. [PRIORITAS TINGGI] Azarine Sunscreen: Wajib tambahkan UV filter resmi dari label kemasan.
-- 3. [PRIORITAS TINGGI] Wardah Sunscreen: Wajib tambahkan UV filter resmi dari label kemasan.
-- 4. [CATATAN] Cosrx Cleanser: Mengandung 'Betaine Salicylate' sebagai sumber BHA, hindari redundant 'Salicylic Acid'.

INSERT INTO public.products (
  name,
  brand,
  category,
  key_ingredients,
  skin_type_fit,
  price_estimate,
  marketplace_url,
  image_url,
  listing_type,
  sponsor_weight,
  is_active
) VALUES
(
  'Skintific 5X Ceramide Barrier Repair Moisture Gel',
  'Skintific',
  'Moisturizer',
  ARRAY['Ceramide', 'Hyaluronic Acid', 'Centella Asiatica', 'Panthenol'],
  ARRAY['dry', 'sensitive', 'normal', 'combination'],
  'Rp 120.000 - 140.000',
  NULL, -- Isi URL spesifik produk di marketplace
  NULL,
  'organic',
  0,
  true
),
(
  'Skintific 2% Salicylic Acid Anti Acne Serum',
  'Skintific',
  'Serum',
  ARRAY['Salicylic Acid', 'Niacinamide', 'Ceramide', 'Centella Asiatica', 'Zinc PCA'],
  ARRAY['oily', 'combination', 'sensitive'],
  'Rp 115.000 - 135.000',
  NULL,
  NULL,
  'organic',
  0,
  true
),
(
  'Somethinc 10% Niacinamide + Moisture Sabi Beet Max Brightening Serum',
  'Somethinc',
  'Serum',
  ARRAY['Niacinamide', 'Centella Asiatica', 'Zinc PCA'],
  ARRAY['oily', 'combination', 'normal'],
  'Rp 115.000 - 130.000',
  NULL,
  NULL,
  'organic',
  0,
  true
),
(
  'Somethinc 2% BHA Salicylic Acid Liquid Perfector',
  'Somethinc',
  'Exfoliant',
  ARRAY['Salicylic Acid', 'Zinc PCA', 'Tea Tree'],
  ARRAY['oily', 'combination'],
  'Rp 110.000 - 125.000',
  NULL,
  NULL,
  'organic',
  0,
  true
),
(
  'Somethinc Granactive Retinoid 2% Emulsion',
  'Somethinc',
  'Serum',
  ARRAY['Granactive Retinoid', 'Hyaluronic Acid', 'Ceramide'], -- 'Retinol' dihapus sesuai catatan verifikasi
  ARRAY['normal', 'combination', 'dry', 'oily'],
  'Rp 150.000 - 175.000',
  NULL,
  NULL,
  'organic',
  0,
  true
),
(
  'Avoskin Miraculous Refining Toner',
  'Avoskin',
  'Toner',
  ARRAY['AHA', 'BHA', 'Salicylic Acid', 'Niacinamide', 'Tea Tree'],
  ARRAY['oily', 'combination'],
  'Rp 160.000 - 180.000',
  NULL,
  NULL,
  'organic',
  0,
  true
),
(
  'Avoskin Your Skin Bae Vitamin C 3% + Niacinamide 2% Serum',
  'Avoskin',
  'Serum',
  ARRAY['Vitamin C', 'Niacinamide', 'Hyaluronic Acid'],
  ARRAY['normal', 'combination', 'dry'],
  'Rp 135.000 - 150.000',
  NULL,
  NULL,
  'organic',
  0,
  true
),
(
  'The Originote Hyalucera Moisturizer Gel',
  'The Originote',
  'Moisturizer',
  ARRAY['Hyaluronic Acid', 'Ceramide', 'Centella Asiatica'],
  ARRAY['dry', 'normal', 'combination', 'oily'],
  'Rp 42.000 - 55.000',
  NULL,
  NULL,
  'organic',
  0,
  true
),
(
  'The Originote Cica-B5 Soothing Cleanser',
  'The Originote',
  'Cleanser',
  ARRAY['Centella Asiatica', 'Panthenol', 'Salicylic Acid'],
  ARRAY['sensitive', 'oily', 'combination'],
  'Rp 38.000 - 45.000',
  NULL,
  NULL,
  'organic',
  0,
  true
),
(
  'Glad2Glow Centella Allantoin Soothing Gel Moisturizer',
  'Glad2Glow',
  'Moisturizer',
  ARRAY['Centella Asiatica', 'Allantoin', 'Panthenol'],
  ARRAY['oily', 'sensitive', 'combination'],
  'Rp 39.000 - 49.000',
  NULL,
  NULL,
  'organic',
  0,
  true
),
(
  'Glad2Glow Mugwort Salicylic Acid Acne Clay Stick',
  'Glad2Glow',
  'Mask',
  ARRAY['Salicylic Acid', 'Mugwort', 'Centella Asiatica', 'Niacinamide'],
  ARRAY['oily', 'combination'],
  'Rp 39.000 - 49.000',
  NULL,
  NULL,
  'organic',
  0,
  true
),
(
  'Azarine Hydrasoothe Sunscreen Gel SPF45 PA++++',
  'Azarine',
  'Sunscreen',
  ARRAY['Hyaluronic Acid', 'Centella Asiatica', 'Niacinamide'], -- Catatan: Perlu dilengkapi UV filter dari kemasan resmi
  ARRAY['oily', 'combination', 'sensitive', 'normal'],
  'Rp 55.000 - 65.000',
  NULL,
  NULL,
  'organic',
  0,
  true
),
(
  'Cosrx Low pH Good Morning Gel Cleanser',
  'Cosrx',
  'Cleanser',
  ARRAY['Tea Tree', 'Betaine Salicylate'], -- 'Salicylic Acid' disederhanakan ke Betaine Salicylate
  ARRAY['oily', 'sensitive', 'combination'],
  'Rp 95.000 - 120.000',
  NULL,
  NULL,
  'organic',
  0,
  true
),
(
  'Cosrx Advanced Snail 96 Mucin Power Essence',
  'Cosrx',
  'Toner',
  ARRAY['Snail Mucin', 'Hyaluronic Acid', 'Panthenol', 'Allantoin'],
  ARRAY['dry', 'sensitive', 'normal', 'combination'],
  'Rp 170.000 - 210.000',
  NULL,
  NULL,
  'organic',
  0,
  true
),
(
  'Wardah UV Shield Essential Gel Sunscreen SPF 35 PA+++',
  'Wardah',
  'Sunscreen',
  ARRAY['Vitamin C', 'Vitamin E', 'Panthenol', 'Niacinamide'], -- Catatan: Perlu dilengkapi UV filter dari kemasan resmi
  ARRAY['normal', 'dry', 'combination'],
  'Rp 35.000 - 42.000',
  NULL,
  NULL,
  'organic',
  0,
  true
);
