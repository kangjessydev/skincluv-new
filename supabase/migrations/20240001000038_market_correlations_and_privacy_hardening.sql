-- ==============================================================================
-- Migration: 20240001000038_market_correlations_and_privacy_hardening.sql
-- Description:
-- 1. Hardens privacy by revoking admin access to user_clinical_memories (UU PDP compliance)
-- 2. Creates market_skin_product_correlations table (Zero PII - de-identified market intelligence)
-- 3. Adds record_market_correlation and get_market_correlations RPC functions
-- ==============================================================================

-- 1. Revoke Admin Access on user_clinical_memories (strictly private to individual users)
DROP POLICY IF EXISTS "clinical_memories_admin_select_all" ON public.user_clinical_memories;
DROP POLICY IF EXISTS "clinical_memories_admin_delete" ON public.user_clinical_memories;

-- Ensure only the owner can access their own memory/allergies
DROP POLICY IF EXISTS "clinical_memories_select_own" ON public.user_clinical_memories;
CREATE POLICY "clinical_memories_select_own"
    ON public.user_clinical_memories FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 2. Table: public.market_skin_product_correlations (Zero PII - Anonymous Market Intelligence)
CREATE TABLE IF NOT EXISTS public.market_skin_product_correlations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skin_concern TEXT NOT NULL,
    skin_type TEXT DEFAULT 'all',
    product_name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    associated_ingredients TEXT[] DEFAULT '{}',
    source_feature TEXT NOT NULL CHECK (source_feature IN ('face_scan', 'ingredient_scan', 'chatbot', 'recommendation')),
    occurrence_count INT NOT NULL DEFAULT 1,
    last_occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_concern_product_feature UNIQUE (skin_concern, product_name, source_feature)
);

CREATE INDEX IF NOT EXISTS idx_market_corr_concern ON public.market_skin_product_correlations (skin_concern);
CREATE INDEX IF NOT EXISTS idx_market_corr_product ON public.market_skin_product_correlations (product_name);
CREATE INDEX IF NOT EXISTS idx_market_corr_count ON public.market_skin_product_correlations (occurrence_count DESC);

-- Enable RLS
ALTER TABLE public.market_skin_product_correlations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and insert/upsert anonymously
DROP POLICY IF EXISTS "market_corr_select" ON public.market_skin_product_correlations;
CREATE POLICY "market_corr_select"
    ON public.market_skin_product_correlations FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "market_corr_admin_all" ON public.market_skin_product_correlations;
CREATE POLICY "market_corr_admin_all"
    ON public.market_skin_product_correlations FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. RPC: Record correlation anonymously (upsert atomic)
CREATE OR REPLACE FUNCTION public.record_market_correlation(
    p_skin_concern TEXT,
    p_skin_type TEXT,
    p_product_name TEXT,
    p_brand TEXT,
    p_category TEXT,
    p_ingredients TEXT[],
    p_source_feature TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.market_skin_product_correlations (
        skin_concern,
        skin_type,
        product_name,
        brand,
        category,
        associated_ingredients,
        source_feature,
        occurrence_count,
        last_occurred_at
    )
    VALUES (
        TRIM(p_skin_concern),
        COALESCE(NULLIF(TRIM(p_skin_type), ''), 'all'),
        TRIM(p_product_name),
        NULLIF(TRIM(p_brand), ''),
        NULLIF(TRIM(p_category), ''),
        COALESCE(p_ingredients, '{}'),
        p_source_feature,
        1,
        now()
    )
    ON CONFLICT ON CONSTRAINT uq_concern_product_feature
    DO UPDATE SET
        occurrence_count = market_skin_product_correlations.occurrence_count + 1,
        associated_ingredients = ARRAY(
            SELECT DISTINCT unnest(market_skin_product_correlations.associated_ingredients || EXCLUDED.associated_ingredients)
        ),
        last_occurred_at = now();
END;
$$;

-- 4. RPC: Get market correlations for admin dashboard
CREATE OR REPLACE FUNCTION public.get_market_correlations(
    p_concern TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    skin_concern TEXT,
    skin_type TEXT,
    product_name TEXT,
    brand TEXT,
    category TEXT,
    associated_ingredients TEXT[],
    source_feature TEXT,
    occurrence_count INT,
    last_occurred_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        c.id,
        c.skin_concern,
        c.skin_type,
        c.product_name,
        c.brand,
        c.category,
        c.associated_ingredients,
        c.source_feature,
        c.occurrence_count,
        c.last_occurred_at
    FROM public.market_skin_product_correlations c
    WHERE (p_concern IS NULL OR p_concern = 'all' OR LOWER(c.skin_concern) = LOWER(p_concern))
    ORDER BY c.occurrence_count DESC, c.last_occurred_at DESC
    LIMIT 50;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.record_market_correlation(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_market_correlations(TEXT) TO authenticated, service_role;

-- 5. Seed initial representative correlations (from verified popular product formulas)
INSERT INTO public.market_skin_product_correlations (skin_concern, skin_type, product_name, brand, category, associated_ingredients, source_feature, occurrence_count)
VALUES
    ('Jerawat', 'Berminyak', 'Acne Care 2% BHA Salicylic Acid Serum', 'Somethinc', 'Serum', ARRAY['Salicylic Acid', 'Zinc PCA', 'Centella Asiatica'], 'ingredient_scan', 142),
    ('Jerawat', 'Berminyak', '5X Ceramide Barrier Moisture Gel', 'Skintific', 'Moisturizer', ARRAY['Ceramide NP', 'Hyaluronic Acid', 'Centella Asiatica'], 'chatbot', 98),
    ('Flek Hitam', 'Kombinasi', 'Dark Spot Correcting Glow Serum', 'Axis-Y', 'Serum', ARRAY['Niacinamide', 'Squalane', 'Rice Bran Extract'], 'ingredient_scan', 115),
    ('Flek Hitam', 'Kering', 'Brightening Serum Tranexamic Acid 3%', 'Avoskin', 'Serum', ARRAY['Tranexamic Acid', 'Niacinamide', 'Alpha Arbutin'], 'face_scan', 84),
    ('Kulit Kusam', 'Kering', 'Galactomyces Ferment Filtrate Essence', 'COSRX', 'Essence', ARRAY['Galactomyces', 'Niacinamide', 'Sodium Hyaluronate'], 'chatbot', 76),
    ('Pori-pori Besar', 'Berminyak', 'Pore Clarifying Niacinamide 10% Toner', 'The Ordinary', 'Toner', ARRAY['Niacinamide', 'Zinc PCA', 'Witch Hazel'], 'ingredient_scan', 63),
    ('Skin Barrier Rusak', 'Sensitif', 'Calming Cicamide Relief Cream', 'Skintific', 'Moisturizer', ARRAY['Centella Asiatica', 'Ceramide NP', 'Panthenol'], 'face_scan', 120),
    ('Anti-Aging', 'Kering', 'Encapsulated Retinol 1% Renewal Serum', 'Somethinc', 'Serum', ARRAY['Retinol', 'Squalane', 'Peptides'], 'chatbot', 59)
ON CONFLICT ON CONSTRAINT uq_concern_product_feature
DO UPDATE SET occurrence_count = market_skin_product_correlations.occurrence_count;
