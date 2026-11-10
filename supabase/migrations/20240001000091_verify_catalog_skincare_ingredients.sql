-- ==============================================================================
-- Migration: 20240001000091_verify_catalog_skincare_ingredients.sql
-- Description:
-- Marks the 98 pre-curated skincare ingredients as verified so that
-- both the Chatbot RAG and Ingredient Scan enrichment pipelines can utilize
-- them as trusted ground truth across DEV and PROD environments.
-- ==============================================================================

UPDATE public.skincare_ingredients
SET is_verified = true
WHERE is_verified IS NOT TRUE;
