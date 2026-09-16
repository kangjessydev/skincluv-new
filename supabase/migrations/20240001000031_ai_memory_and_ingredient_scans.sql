-- ============================================================
-- Migration 031: AI Memory Tables & Admin Access
-- 1. Membuat tabel ingredient_scans untuk persistensi scan ingredient.
-- 2. Menambahkan RLS admin (is_admin()) untuk face_scans, chat_sessions,
--    chat_messages, ai_request_logs, dan ingredient_scans.
-- ============================================================

-- ---- 1. Tabel ingredient_scans ----
CREATE TABLE IF NOT EXISTS public.ingredient_scans (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_name          text NOT NULL,
  brand                 text,
  safety_score          integer,
  is_safe               boolean NOT NULL DEFAULT true,
  matched_concerns      text[] NOT NULL DEFAULT '{}',
  key_ingredients       text[] NOT NULL DEFAULT '{}',
  ingredients_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_ai_response       jsonb,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ingredient_scans ENABLE ROW LEVEL SECURITY;

-- User boleh baca scan miliknya sendiri
DROP POLICY IF EXISTS "ingredient_scans_select_own" ON public.ingredient_scans;
CREATE POLICY "ingredient_scans_select_own" ON public.ingredient_scans
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- User boleh simpan scan miliknya sendiri
DROP POLICY IF EXISTS "ingredient_scans_insert_own" ON public.ingredient_scans;
CREATE POLICY "ingredient_scans_insert_own" ON public.ingredient_scans
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin boleh baca SEMUA ingredient scans
DROP POLICY IF EXISTS "ingredient_scans_admin_select_all" ON public.ingredient_scans;
CREATE POLICY "ingredient_scans_admin_select_all" ON public.ingredient_scans
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Admin boleh hapus ingredient scan
DROP POLICY IF EXISTS "ingredient_scans_admin_delete" ON public.ingredient_scans;
CREATE POLICY "ingredient_scans_admin_delete" ON public.ingredient_scans
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---- 2. Admin SELECT Policies untuk Memori AI yang sudah ada ----

-- face_scans: Admin boleh lihat semua riwayat scan wajah
DROP POLICY IF EXISTS "face_scans_admin_select_all" ON public.face_scans;
CREATE POLICY "face_scans_admin_select_all" ON public.face_scans
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- chat_sessions: Admin boleh lihat semua sesi percakapan
DROP POLICY IF EXISTS "chat_sessions_admin_select_all" ON public.chat_sessions;
CREATE POLICY "chat_sessions_admin_select_all" ON public.chat_sessions
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- chat_messages: Admin boleh lihat semua pesan percakapan
DROP POLICY IF EXISTS "chat_messages_admin_select_all" ON public.chat_messages;
CREATE POLICY "chat_messages_admin_select_all" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ai_request_logs: Admin boleh lihat semua log dan metrik AI
DROP POLICY IF EXISTS "ai_logs_admin_select_all" ON public.ai_request_logs;
CREATE POLICY "ai_logs_admin_select_all" ON public.ai_request_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());
