-- ============================================================
-- Migration 028: Admin Auth & RBAC Foundation
-- Fondasi role admin — dipakai sebagai prasyarat semua halaman
-- admin panel (Fase 1 dst). Tidak ada cara bagi client untuk
-- menulis ke tabel ini — assign role hanya manual via SQL Editor
-- di fase ini (mekanisme UI menyusul di Fase 3).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('admin')),
  granted_by uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User cuma boleh baca role miliknya sendiri (buat cek "apakah saya admin")
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Tidak ada hak tulis untuk client sama sekali di fase ini.
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;

-- ---- Helper function: is_admin() ----
-- Dipakai di dalam RLS policy tabel-tabel admin (mulai Fase 1).
-- SECURITY DEFINER + search_path dikunci ke 'public' sebagai praktik
-- keamanan standar untuk function jenis ini.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- CATATAN MANUAL (TIDAK dieksekusi otomatis oleh migration ini):
-- Untuk menjadikan akun kamu sendiri admin pertama kali, jalankan
-- manual di Supabase SQL Editor SETELAH migration ini berhasil:
--
--   INSERT INTO public.user_roles (user_id, role)
--   VALUES ('<UUID_AKUN_KAMU_DARI_TABEL_auth.users>', 'admin');
--
-- Cara cari UUID akun kamu: Supabase Dashboard -> Authentication ->
-- Users -> cari email kamu -> copy User UID.
-- ============================================================
