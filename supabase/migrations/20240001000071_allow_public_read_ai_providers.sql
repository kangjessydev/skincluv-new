-- Migration 071: Allow public read on ai_providers registry
DROP POLICY IF EXISTS "allow_read_ai_providers" ON public.ai_providers;
CREATE POLICY "allow_read_ai_providers" ON public.ai_providers
  FOR SELECT USING (true);
