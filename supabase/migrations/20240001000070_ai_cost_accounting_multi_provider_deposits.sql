-- ==============================================================================
-- Migration 070: AI Cost Accounting, Multi-Provider Deposits & Balances (RFC 014)
-- Provides dynamic AI provider registry, dual-entry deposits, effective exchange
-- rate generation, provider-level cost attribution, and remaining balance view.
-- ==============================================================================

-- 1. Tabel Registri Provider AI
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id              text PRIMARY KEY,
  name            text NOT NULL,
  billing_type    text NOT NULL DEFAULT 'prepaid_usd'
                  CHECK (billing_type IN ('prepaid_usd', 'prepaid_tokens', 'postpaid_usd', 'free_tier')),
  currency        text NOT NULL DEFAULT 'USD',
  website_url     text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Seed Provider AI Aktif & Cadangan
INSERT INTO public.ai_providers (id, name, billing_type, currency, website_url) VALUES
  ('google',     'Google Cloud (Vertex AI / Gemini)', 'prepaid_usd', 'USD', 'https://aistudio.google.com'),
  ('groq',       'Groq Cloud (Fast Qwen / Llama)',    'prepaid_usd', 'USD', 'https://console.groq.com'),
  ('deepseek',   'DeepSeek AI',                       'prepaid_usd', 'USD', 'https://platform.deepseek.com'),
  ('openrouter', 'OpenRouter (Multi-Model Hub)',      'prepaid_usd', 'USD', 'https://openrouter.ai'),
  ('anthropic',  'Anthropic Claude',                  'prepaid_usd', 'USD', 'https://console.anthropic.com'),
  ('openai',     'OpenAI API',                        'prepaid_usd', 'USD', 'https://platform.openai.com'),
  ('tavily',     'Tavily Web Search AI',              'prepaid_usd', 'USD', 'https://tavily.com')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    billing_type = EXCLUDED.billing_type,
    website_url = EXCLUDED.website_url;

-- 2. Tabel Deposit Multi-Provider
CREATE TABLE IF NOT EXISTS public.provider_deposits (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id         text NOT NULL REFERENCES public.ai_providers(id) ON DELETE RESTRICT,
  amount_paid_idr     numeric(12,2) NOT NULL CHECK (amount_paid_idr > 0),
  amount_paid_usd     numeric(10,2),
  credited_amount_usd numeric(10,2) CHECK (credited_amount_usd >= 0),
  credited_tokens     bigint CHECK (credited_tokens >= 0),
  effective_rate_idr  numeric(10,2) GENERATED ALWAYS AS (
    CASE
      WHEN credited_amount_usd > 0 THEN amount_paid_idr / credited_amount_usd
      ELSE NULL
    END
  ) STORED,
  invoice_number      text,
  payment_method      text,
  notes               text,
  deposited_at        timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deposit_has_credit CHECK (
    credited_amount_usd > 0 OR credited_tokens > 0
  )
);

CREATE INDEX IF NOT EXISTS idx_provider_deposits_provider_date
  ON public.provider_deposits (provider_id, deposited_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_deposits_invoice
  ON public.provider_deposits (invoice_number) WHERE invoice_number IS NOT NULL;

-- 3. Migrasi & Backfill dari provider_topups jika ada
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'provider_topups'
  ) THEN
    INSERT INTO public.provider_deposits (
      provider_id,
      amount_paid_idr,
      credited_amount_usd,
      deposited_at,
      notes,
      created_by,
      created_at
    )
    SELECT
      CASE
        WHEN provider = 'google' THEN 'google'
        WHEN provider = 'anthropic' THEN 'anthropic'
        WHEN provider = 'groq' THEN 'groq'
        WHEN provider = 'openai' THEN 'openai'
        ELSE 'google'
      END,
      amount_idr,
      COALESCE(amount_usd, amount_idr / 16000.0),
      topped_up_at::timestamptz,
      notes,
      created_by,
      created_at
    FROM public.provider_topups
    WHERE amount_idr > 0;

    -- Ubah nama tabel lama sebagai cadangan audit
    ALTER TABLE public.provider_topups RENAME TO provider_topups_deprecated;
  END IF;
END $$;

-- 4. Tambah kolom provider_id di ai_request_logs
ALTER TABLE public.ai_request_logs
  ADD COLUMN IF NOT EXISTS provider_id text REFERENCES public.ai_providers(id);

CREATE INDEX IF NOT EXISTS idx_ai_request_logs_provider_created
  ON public.ai_request_logs (provider_id, created_at DESC);

-- Backfill provider_id pada log lama dari relasi model_configs
UPDATE public.ai_request_logs l
SET provider_id = m.provider
FROM public.model_configs m
WHERE l.model_config_id = m.id
  AND l.provider_id IS NULL;

-- 5. RLS Policies
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_deposits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_read_ai_providers" ON public.ai_providers;
CREATE POLICY "allow_read_ai_providers" ON public.ai_providers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_ai_providers" ON public.ai_providers;
CREATE POLICY "admin_manage_ai_providers" ON public.ai_providers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_provider_deposits" ON public.provider_deposits;
CREATE POLICY "admin_all_provider_deposits" ON public.provider_deposits
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. View Saldo & Posisi Finansial per Provider
CREATE OR REPLACE VIEW public.provider_balances AS
SELECT
  p.id AS provider_id,
  p.name AS provider_name,
  p.billing_type,
  p.currency,
  COALESCE(dep.total_paid_idr, 0) AS total_paid_idr,
  COALESCE(dep.total_credited_usd, 0) AS total_credited_usd,
  COALESCE(dep.total_credited_tokens, 0) AS total_credited_tokens,
  COALESCE(usage.total_cost_usd, 0) AS total_cost_usd,
  COALESCE(usage.total_tokens, 0) AS total_tokens_used,
  CASE
    WHEN p.billing_type = 'prepaid_usd'
      THEN COALESCE(dep.total_credited_usd, 0) - COALESCE(usage.total_cost_usd, 0)
    WHEN p.billing_type = 'prepaid_tokens'
      THEN COALESCE(dep.total_credited_tokens, 0) - COALESCE(usage.total_tokens, 0)
    ELSE NULL
  END AS remaining_balance,
  CASE
    WHEN dep.total_credited_usd > 0
      THEN dep.total_paid_idr / dep.total_credited_usd
    ELSE 16000.00
  END AS average_effective_rate_idr
FROM public.ai_providers p
LEFT JOIN (
  SELECT
    provider_id,
    sum(amount_paid_idr) AS total_paid_idr,
    sum(credited_amount_usd) AS total_credited_usd,
    sum(credited_tokens) AS total_credited_tokens
  FROM public.provider_deposits
  GROUP BY provider_id
) dep ON dep.provider_id = p.id
LEFT JOIN (
  SELECT
    provider_id,
    sum(cost_usd) AS total_cost_usd,
    sum(tokens_used) AS total_tokens
  FROM public.ai_request_logs
  WHERE provider_id IS NOT NULL
  GROUP BY provider_id
) usage ON usage.provider_id = p.id
WHERE p.is_active = true;
