-- ==============================================================================
-- Migration 032: Autonomous AI Knowledge Base, Semantic Formula Cache,
-- Clinical Memory Engine, and Fine-Tuning Dataset Repository
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Table: public.skincare_ingredients (Global Skincare Knowledge Base)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skincare_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_name TEXT NOT NULL UNIQUE,
    inci_name TEXT,
    aliases TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'Other', -- e.g. Active, Antioxidant, Emollient, Hydrating, Preservative, Exfoliant
    safety_rating TEXT DEFAULT 'aman' CHECK (safety_rating IN ('aman', 'hati', 'hindari')),
    comedogenic_rating INT DEFAULT 0 CHECK (comedogenic_rating BETWEEN 0 AND 5),
    description TEXT,
    common_functions TEXT[] DEFAULT '{}',
    incompatible_with TEXT[] DEFAULT '{}',
    occurrence_count INT DEFAULT 1,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skincare_ingredients_name ON public.skincare_ingredients (canonical_name);
CREATE INDEX IF NOT EXISTS idx_skincare_ingredients_category ON public.skincare_ingredients (category);
CREATE INDEX IF NOT EXISTS idx_skincare_ingredients_safety ON public.skincare_ingredients (safety_rating);

-- RLS
ALTER TABLE public.skincare_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skincare_ingredients_select_all"
    ON public.skincare_ingredients FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "skincare_ingredients_admin_all"
    ON public.skincare_ingredients FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. Table: public.skincare_product_formulas (Product Semantic Cache)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skincare_product_formulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    brand TEXT,
    category TEXT, -- e.g. Sunscreen, Serum, Toner, Moisturizer, Cleanser
    formula_hash TEXT NOT NULL UNIQUE, -- Normalized hash of ingredients
    ingredients_list TEXT[] DEFAULT '{}',
    ingredients_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    overall_safety_score INT DEFAULT 85 CHECK (overall_safety_score BETWEEN 0 AND 100),
    scan_hit_count INT DEFAULT 1,
    estimated_tokens_saved INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_formulas_hash ON public.skincare_product_formulas (formula_hash);
CREATE INDEX IF NOT EXISTS idx_product_formulas_name ON public.skincare_product_formulas (product_name);
CREATE INDEX IF NOT EXISTS idx_product_formulas_brand ON public.skincare_product_formulas (brand);

-- RLS
ALTER TABLE public.skincare_product_formulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_formulas_select_all"
    ON public.skincare_product_formulas FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "product_formulas_admin_all"
    ON public.skincare_product_formulas FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. Table: public.user_clinical_memories (Episodic Clinical Memory)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_clinical_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL CHECK (memory_type IN ('allergy', 'sensitivity', 'treatment_reaction', 'preference', 'skin_trend')),
    entity TEXT NOT NULL, -- e.g. Fragrance, Retinol, Alcohol Denat
    clinical_fact TEXT NOT NULL, -- e.g. Kulit perih dan timbul eritema setelah aplikasi konsentrasi tinggi
    confidence_score NUMERIC DEFAULT 0.9 CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    source_feature TEXT DEFAULT 'chatbot' CHECK (source_feature IN ('chatbot', 'face_analysis', 'ingredient_scan')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_clinical_memories_user ON public.user_clinical_memories (user_id);
CREATE INDEX IF NOT EXISTS idx_user_clinical_memories_active ON public.user_clinical_memories (user_id, is_active);

-- RLS
ALTER TABLE public.user_clinical_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinical_memories_select_own"
    ON public.user_clinical_memories FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "clinical_memories_insert_own"
    ON public.user_clinical_memories FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clinical_memories_update_own"
    ON public.user_clinical_memories FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clinical_memories_admin_select_all"
    ON public.user_clinical_memories FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "clinical_memories_admin_delete"
    ON public.user_clinical_memories FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. Table: public.ai_training_datasets (Fine-Tuning & Few-Shot Repository)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_training_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_slug TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    user_input TEXT NOT NULL,
    ideal_response JSONB NOT NULL,
    quality_tier TEXT NOT NULL DEFAULT 'candidate' CHECK (quality_tier IN ('gold', 'silver', 'candidate')),
    quality_score NUMERIC DEFAULT 1.0,
    is_few_shot_exemplar BOOLEAN DEFAULT false,
    domain_tags TEXT[] DEFAULT '{}',
    source_log_id UUID REFERENCES public.ai_request_logs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_training_tier ON public.ai_training_datasets (quality_tier);
CREATE INDEX IF NOT EXISTS idx_ai_training_feature ON public.ai_training_datasets (feature_slug);
CREATE INDEX IF NOT EXISTS idx_ai_training_exemplar ON public.ai_training_datasets (is_few_shot_exemplar);

-- RLS
ALTER TABLE public.ai_training_datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_training_admin_all"
    ON public.ai_training_datasets FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. Autonomous Ingestion & Token Saving RPC Functions
-- ------------------------------------------------------------------------------

-- Ingest ingredients and product formula from a successful scan
CREATE OR REPLACE FUNCTION public.ingest_ingredient_scan_knowledge(
    p_product_name TEXT,
    p_brand TEXT,
    p_formula_hash TEXT,
    p_ingredients JSONB,
    p_safety_score INT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_formula_id UUID;
    v_item JSONB;
    v_ing_name TEXT;
    v_badge TEXT;
    v_func TEXT;
    v_ing_list TEXT[] := '{}';
BEGIN
    -- 1. Extract ingredients list and upsert into skincare_ingredients knowledge base
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_ingredients, '[]'::jsonb))
    LOOP
        v_ing_name := trim(v_item->>'name');
        v_badge    := lower(COALESCE(v_item->>'badge', 'aman'));
        v_func     := trim(COALESCE(v_item->>'function', ''));

        IF v_ing_name IS NOT NULL AND v_ing_name <> '' THEN
            v_ing_list := array_append(v_ing_list, v_ing_name);

            -- Normalize badge to allowed check values
            IF v_badge NOT IN ('aman', 'hati', 'hindari') THEN
                v_badge := 'aman';
            END IF;

            INSERT INTO public.skincare_ingredients (
                canonical_name,
                category,
                safety_rating,
                common_functions,
                occurrence_count
            )
            VALUES (
                v_ing_name,
                CASE 
                    WHEN lower(v_func) LIKE '%active%' OR lower(v_func) LIKE '%aktif%' THEN 'Active'
                    WHEN lower(v_func) LIKE '%hydrate%' OR lower(v_func) LIKE '%lembab%' THEN 'Hydrating'
                    WHEN lower(v_func) LIKE '%antioksidan%' THEN 'Antioxidant'
                    WHEN lower(v_func) LIKE '%preservative%' OR lower(v_func) LIKE '%pengawet%' THEN 'Preservative'
                    ELSE 'Other'
                END,
                v_badge,
                CASE WHEN v_func <> '' THEN ARRAY[v_func] ELSE '{}' END,
                1
            )
            ON CONFLICT (canonical_name) DO UPDATE SET
                occurrence_count = skincare_ingredients.occurrence_count + 1,
                updated_at = now();
        END IF;
    END LOOP;

    -- 2. Upsert into skincare_product_formulas cache
    INSERT INTO public.skincare_product_formulas (
        product_name,
        brand,
        formula_hash,
        ingredients_list,
        ingredients_breakdown,
        overall_safety_score,
        scan_hit_count
    )
    VALUES (
        COALESCE(p_product_name, 'Produk Skincare'),
        p_brand,
        p_formula_hash,
        v_ing_list,
        p_ingredients,
        COALESCE(p_safety_score, 85),
        1
    )
    ON CONFLICT (formula_hash) DO UPDATE SET
        scan_hit_count = skincare_product_formulas.scan_hit_count + 1,
        updated_at = now()
    RETURNING id INTO v_formula_id;

    RETURN v_formula_id;
END;
$$;

-- Increment cache hit & calculate saved tokens
CREATE OR REPLACE FUNCTION public.record_formula_cache_hit(
    p_formula_id UUID,
    p_tokens_saved INT DEFAULT 2500
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.skincare_product_formulas
    SET 
        scan_hit_count = scan_hit_count + 1,
        estimated_tokens_saved = estimated_tokens_saved + p_tokens_saved,
        updated_at = now()
    WHERE id = p_formula_id;
END;
$$;
