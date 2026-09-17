-- ==============================================================================
-- Migration 034: Dynamic AI Feature Credit Cost
-- Menambahkan kolom credit_cost ke public.ai_features agar biaya penggunaan
-- per fitur AI dapat diatur secara dinamis oleh Admin tanpa hardcode.
-- ==============================================================================

-- 1. Tambah kolom credit_cost ke tabel ai_features
ALTER TABLE public.ai_features 
  ADD COLUMN IF NOT EXISTS credit_cost integer NOT NULL DEFAULT 1;

-- 2. Inisialisasi biaya default untuk fitur-fitur yang sudah ada
UPDATE public.ai_features SET credit_cost = 5 WHERE slug = 'face_analysis';
UPDATE public.ai_features SET credit_cost = 3 WHERE slug = 'ingredient_scan';
UPDATE public.ai_features SET credit_cost = 1 WHERE slug = 'chatbot';
UPDATE public.ai_features SET credit_cost = 2 WHERE slug = 'routine_planner';
UPDATE public.ai_features SET credit_cost = 1 WHERE slug = 'face_validation';
UPDATE public.ai_features SET credit_cost = 1 WHERE slug = 'universal_ai';
