-- ==============================================================================
-- Migration 072: Vendor Categories & Secure AI Providers RLS (RFC 015 - Tahap 1)
-- Menambahkan kolom category pada ai_providers dan mengamankan RLS policy
-- dari akses publik anonim sesuai temuan audit dewan AI.
-- ==============================================================================

-- 1. Tambah kolom category di ai_providers
ALTER TABLE public.ai_providers
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'llm'
  CHECK (category IN ('llm', 'search', 'email', 'infra', 'marketing', 'other'));

-- 2. Update kategori untuk data provider terdaftar
UPDATE public.ai_providers SET category = 'search' WHERE id = 'tavily';
UPDATE public.ai_providers SET category = 'llm' WHERE id IN ('google', 'groq', 'deepseek', 'openrouter', 'anthropic', 'openai');

-- 3. Amankan RLS: Cabut izin baca publik anonim dari Migration 071
DROP POLICY IF EXISTS "allow_read_ai_providers" ON public.ai_providers;

-- Izinkan baca hanya untuk admin terotentikasi
DROP POLICY IF EXISTS "admin_read_ai_providers" ON public.ai_providers;
CREATE POLICY "admin_read_ai_providers" ON public.ai_providers
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Pastikan policy ALL admin tetap ada
DROP POLICY IF EXISTS "admin_manage_ai_providers" ON public.ai_providers;
CREATE POLICY "admin_manage_ai_providers" ON public.ai_providers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
