-- ==============================================================================
-- Migration 068: Admin Full Access RLS for Skincluv Handbook
-- Allows authenticated users with admin role (public.is_admin()) to CRUD handbook entries
-- ==============================================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'skincluv_handbook' AND policyname = 'Admins can manage handbook'
  ) THEN
    CREATE POLICY "Admins can manage handbook"
      ON public.skincluv_handbook
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;
