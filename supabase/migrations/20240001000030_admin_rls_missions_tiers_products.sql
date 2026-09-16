-- ============================================================
-- Migration 030: RLS admin untuk missions, subscription_tiers,
-- quota_configs, dan products.
-- ============================================================

-- ---- missions ----
-- Admin perlu lihat SEMUA misi (termasuk is_active = false),
-- bukan cuma yang aktif seperti policy select user biasa.
DROP POLICY IF EXISTS "missions_admin_select_all" ON public.missions;
CREATE POLICY "missions_admin_select_all" ON public.missions
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "missions_admin_write" ON public.missions;
CREATE POLICY "missions_admin_write" ON public.missions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "missions_admin_update" ON public.missions;
CREATE POLICY "missions_admin_update" ON public.missions
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- subscription_tiers ----
DROP POLICY IF EXISTS "tiers_admin_write" ON public.subscription_tiers;
CREATE POLICY "tiers_admin_write" ON public.subscription_tiers
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tiers_admin_update" ON public.subscription_tiers;
CREATE POLICY "tiers_admin_update" ON public.subscription_tiers
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- quota_configs ----
DROP POLICY IF EXISTS "quota_configs_admin_write" ON public.quota_configs;
CREATE POLICY "quota_configs_admin_write" ON public.quota_configs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "quota_configs_admin_update" ON public.quota_configs;
CREATE POLICY "quota_configs_admin_update" ON public.quota_configs
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- products ----
-- PENTING: products di-REVOKE dari authenticated di migration 026.
-- Harus di-GRANT ulang dulu sebelum RLS policy admin bisa berfungsi.
GRANT INSERT, UPDATE ON public.products TO authenticated;

DROP POLICY IF EXISTS "products_admin_write" ON public.products;
CREATE POLICY "products_admin_write" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_admin_update" ON public.products;
CREATE POLICY "products_admin_update" ON public.products
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
