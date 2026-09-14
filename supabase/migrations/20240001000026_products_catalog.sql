-- ============================================================
-- Migration 026: Tabel Katalog Produk (untuk Product Matching Engine)
-- Diisi manual oleh admin lewat Supabase Table Editor / Retool.
-- TIDAK diisi data dummy di migration ini — katalog dimulai kosong.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.products (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  brand            text,
  category         text        NOT NULL,               -- e.g. 'Serum', 'Moisturizer', 'Cleanser'
  key_ingredients  text[]      NOT NULL DEFAULT '{}',   -- e.g. ARRAY['Niacinamide', 'Zinc PCA']
  skin_type_fit    text[]      NOT NULL DEFAULT '{}',   -- e.g. ARRAY['oily', 'combination']
  price_estimate   text,                                -- e.g. 'Rp 85.000 - 120.000'
  marketplace_url  text,
  image_url        text,
  listing_type     text        NOT NULL DEFAULT 'organic'
                     CHECK (listing_type IN ('organic', 'affiliate', 'endorse')),
  sponsor_weight   integer     NOT NULL DEFAULT 0,      -- boost tambahan untuk affiliate/endorse, HANYA berlaku jika produk sudah lolos ambang batas relevansi (lihat Fase 2)
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_active ON public.products (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_key_ingredients ON public.products USING GIN (key_ingredients);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Hanya boleh dibaca (bukan ditulis) oleh client. Penulisan dilakukan
-- lewat Supabase dashboard (service role / dashboard admin), BUKAN dari aplikasi.
DROP POLICY IF EXISTS "products_select_active" ON public.products;
CREATE POLICY "products_select_active" ON public.products
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Pastikan tidak ada hak tulis untuk client (mengikuti pola migration 022)
REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon, authenticated;
