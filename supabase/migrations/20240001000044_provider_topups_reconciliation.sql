-- Migration 044: Provider Topups & AI Cost Reconciliation (Fase B)
-- Table to record manual prepaid topups for AI Providers (Google, Anthropic, Groq)

CREATE TABLE IF NOT EXISTS public.provider_topups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      text NOT NULL CHECK (provider IN ('google', 'anthropic', 'groq', 'openai')),
  amount_idr    numeric NOT NULL CHECK (amount_idr >= 0),
  amount_usd    numeric CHECK (amount_usd >= 0),
  topped_up_at  date NOT NULL DEFAULT CURRENT_DATE,
  notes         text,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_topups_date ON public.provider_topups (topped_up_at DESC);

ALTER TABLE public.provider_topups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_topups_admin_all" ON public.provider_topups;
CREATE POLICY "provider_topups_admin_all" ON public.provider_topups
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
