-- ==============================================================================
-- Migration: 20240001000039_remove_fake_seed_correlations.sql
-- Description:
-- Removes the 8 fabricated initial seed correlation records from
-- market_skin_product_correlations so that the matrix only reflects organic,
-- real user interactions without artificial numbers.
-- ==============================================================================

DELETE FROM public.market_skin_product_correlations
WHERE product_name IN (
    'Acne Care 2% BHA Salicylic Acid Serum',
    '5X Ceramide Barrier Moisture Gel',
    'Dark Spot Correcting Glow Serum',
    'Brightening Serum Tranexamic Acid 3%',
    'Galactomyces Ferment Filtrate Essence',
    'Pore Clarifying Niacinamide 10% Toner',
    'Calming Cicamide Relief Cream',
    'Encapsulated Retinol 1% Renewal Serum'
)
AND occurrence_count IN (142, 98, 115, 84, 76, 63, 120, 59);
