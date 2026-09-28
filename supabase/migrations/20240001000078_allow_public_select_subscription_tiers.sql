-- ============================================================
-- Migration 078: Allow Public Select for Subscription Tiers & Quota Configs
-- Memungkinkan pengunjung umum (anon) dan pengguna terotentikasi (authenticated)
-- untuk melihat daftar paket langganan, harga promo, dan kuota fitur.
-- ============================================================

DROP POLICY IF EXISTS "tiers_select_all" ON public.subscription_tiers;
CREATE POLICY "tiers_select_all" ON public.subscription_tiers FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "quota_configs_select_all" ON public.quota_configs;
CREATE POLICY "quota_configs_select_all" ON public.quota_configs FOR SELECT TO public USING (true);
