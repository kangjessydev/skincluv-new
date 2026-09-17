-- ============================================================
-- Migration 036: Revoke Admin Access to Private User Personal Data
-- Kepatuhan UU No. 27/2022 (UU PDP):
-- Obrolan pribadi pengguna (chat_messages, chat_sessions),
-- foto/evaluasi klinis wajah (face_scans), dan hasil scan bahan
-- (ingredient_scans) adalah data pribadi rahasia milik pengguna.
-- Admin dilarang mengakses data individual ini.
-- Akses yang dipertahankan untuk Admin HANYA data agregat / log teknis
-- telemetri (ai_request_logs, tripay_invoices, profil non-sensitif).
-- ============================================================

-- 1. Cabut akses admin ke isi pesan obrolan pribadi
DROP POLICY IF EXISTS "chat_messages_admin_select_all" ON public.chat_messages;

-- 2. Cabut akses admin ke sesi obrolan pribadi
DROP POLICY IF EXISTS "chat_sessions_admin_select_all" ON public.chat_sessions;

-- 3. Cabut akses admin ke evaluasi wajah perorangan
DROP POLICY IF EXISTS "face_scans_admin_select_all" ON public.face_scans;

-- 4. Cabut akses admin ke riwayat scan komposisi perorangan
DROP POLICY IF EXISTS "ingredient_scans_admin_select_all" ON public.ingredient_scans;
DROP POLICY IF EXISTS "ingredient_scans_admin_delete" ON public.ingredient_scans;
