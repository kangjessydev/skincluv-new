-- ============================================================
-- Migration 077: Dynamic Subscription Tiers & Promo Engine (RFC 015 Tahap 4)
-- 1. Tambah kolom harga normal/coret (original_price_idr), daftar fitur (features_list),
--    badge promosi (promo_badge), dan flag popular (is_popular).
-- 2. Backfill data default untuk tier Free, Glow, dan Pro.
-- ============================================================

-- 1. Tambah kolom baru di subscription_tiers
ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS original_price_idr integer,
  ADD COLUMN IF NOT EXISTS features_list text[],
  ADD COLUMN IF NOT EXISTS promo_badge text,
  ADD COLUMN IF NOT EXISTS is_popular boolean DEFAULT false;

-- 2. Backfill Tier Free
UPDATE public.subscription_tiers
SET
  original_price_idr = COALESCE(original_price_idr, 0),
  promo_badge = COALESCE(promo_badge, 'Selalu Gratis'),
  is_popular = COALESCE(is_popular, false),
  features_list = COALESCE(features_list, ARRAY[
    '0 Kuota Bawaan (Akses via Credits)',
    'Dapatkan Credits Gratis dari Misi Harian',
    'Scan Wajah & Cek Komposisi Produk',
    'Chatbot Konsultasi Standar'
  ])
WHERE slug = 'free';

-- 3. Backfill Tier Glow
UPDATE public.subscription_tiers
SET
  original_price_idr = COALESCE(original_price_idr, 50000),
  promo_badge = COALESCE(promo_badge, 'Ramah Kantong'),
  is_popular = COALESCE(is_popular, false),
  features_list = COALESCE(features_list, ARRAY[
    '100 Universal AI Uses / 30 Hari',
    'Satu Kuota Bersama: Bebas Dipakai Scan Maupun Chat',
    'Chatbot Konsultasi Ramah (Cepat & Edukatif)',
    'Analisis Kondisi Wajah & Komposisi Skincare',
    'Riwayat Scan Tersimpan Multi-Sesi',
    'Cadangan AI Credits Misi Tetap Utuh'
  ])
WHERE slug = 'glow';

-- 4. Backfill Tier Pro (slug 'premium')
UPDATE public.subscription_tiers
SET
  original_price_idr = COALESCE(original_price_idr, 99000),
  promo_badge = COALESCE(promo_badge, 'Rekomendasi Utama'),
  is_popular = COALESCE(is_popular, true),
  features_list = COALESCE(features_list, ARRAY[
    '500 Universal AI Uses / 30 Hari (Terasa Unlimited)',
    'Chatbot Skincare Expert (Analisis Lebih Dalam & Presisi)',
    'Pencarian Web Terverifikasi (Tavily Grounding)',
    'Analisis Layering Bahan Aktif Pagi & Malam',
    'Evaluasi Kompatibilitas Skin Barrier & pH Formula',
    'Deep Memory (Ingatan Lintas Sesi Percakapan)',
    'Prioritas Respon AI Cepat & Responsif',
    'Badge Eksklusif PRO di Profil'
  ])
WHERE slug = 'premium';
