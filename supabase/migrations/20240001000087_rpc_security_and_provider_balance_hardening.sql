-- ==============================================================================
-- Migration 087: Zero-Trust RPC Hardening, View Security Invoker, Deposit-Scoped
-- Provider Balances, and Public Contact Messages Table
-- ==============================================================================

-- 1. Hardening get_market_correlations: Enforce Admin Check
CREATE OR REPLACE FUNCTION public.get_market_correlations(
  p_concern TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  skin_concern TEXT,
  skin_type TEXT,
  product_name TEXT,
  brand TEXT,
  category TEXT,
  associated_ingredients TEXT[],
  source_feature TEXT,
  occurrence_count INT,
  last_occurred_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: hanya admin yang dapat mengakses korelasi intelijen pasar';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.skin_concern,
    c.skin_type,
    c.product_name,
    c.brand,
    c.category,
    c.associated_ingredients,
    c.source_feature,
    c.occurrence_count,
    c.last_occurred_at
  FROM public.market_skin_product_correlations c
  WHERE (p_concern IS NULL OR p_concern = 'all' OR LOWER(c.skin_concern) = LOWER(p_concern))
  ORDER BY c.occurrence_count DESC, c.last_occurred_at DESC
  LIMIT 50;
END;
$$;

-- 2. Lock Down Server-Only SECURITY DEFINER RPCs (service_role ONLY)
REVOKE EXECUTE ON FUNCTION public.process_tripay_payment(text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_tripay_payment(text, text, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.rollback_deduction(uuid, uuid, uuid, text, integer, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_deduction(uuid, uuid, uuid, text, integer, uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.deduct_coins(uuid, integer, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_coins(uuid, integer, uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.deduct_quota(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_quota(uuid, uuid, uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.ingest_ingredient_scan_knowledge(text, text, text, jsonb, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ingest_ingredient_scan_knowledge(text, text, text, jsonb, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_formula_cache_hit(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_formula_cache_hit(uuid, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_market_correlation(text, text, text, text, text, text[], text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_market_correlation(text, text, text, text, text, text[], text) TO service_role;

-- 3. Lock Down Authenticated-Only SECURITY DEFINER RPCs (Revoke anon/PUBLIC)
REVOKE EXECUTE ON FUNCTION public.admin_adjust_user_coins(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_user_coins(uuid, integer, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.admin_manual_create_and_settle_pass(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_manual_create_and_settle_pass(uuid, text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.admin_manual_settle_invoice(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_manual_settle_invoice(text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.claim_mission(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_mission(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.cs_get_customer_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cs_get_customer_summary(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.delete_user_account(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.delete_user_face_scans_only(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_face_scans_only(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_market_correlations(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_market_correlations(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_market_intelligence_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_market_intelligence_stats() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_my_roles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_roles() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.record_admin_audit_log(text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_admin_audit_log(text, text, text, jsonb) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.record_ai_feedback(uuid, smallint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_ai_feedback(uuid, smallint) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.track_daily_login() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.track_daily_login() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.track_profile_completion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.track_profile_completion() TO authenticated, service_role;

-- 4. Harden Views with security_invoker = true & Deposit-Window Accounting
ALTER VIEW public.active_subscriptions SET (security_invoker = true);
REVOKE ALL ON public.active_subscriptions FROM PUBLIC, anon;
GRANT SELECT ON public.active_subscriptions TO authenticated, service_role;

CREATE OR REPLACE VIEW public.provider_balances
WITH (security_invoker = true) AS
WITH dep AS (
  SELECT
    provider_id,
    sum(amount_paid_idr) AS total_paid_idr,
    sum(credited_amount_usd) AS total_credited_usd,
    sum(credited_tokens) AS total_credited_tokens,
    min(deposited_at) AS first_deposited_at
  FROM public.provider_deposits
  GROUP BY provider_id
),
usage AS (
  SELECT
    l.provider_id,
    sum(l.cost_usd) AS total_cost_usd,
    sum(l.tokens_used) AS total_tokens
  FROM public.ai_request_logs l
  LEFT JOIN dep d ON d.provider_id = l.provider_id
  WHERE l.provider_id IS NOT NULL
    AND l.status = 'success'
    AND (d.first_deposited_at IS NULL OR l.created_at >= d.first_deposited_at)
  GROUP BY l.provider_id
)
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
LEFT JOIN dep ON dep.provider_id = p.id
LEFT JOIN usage ON usage.provider_id = p.id
WHERE p.is_active = true;

REVOKE ALL ON public.provider_balances FROM PUBLIC, anon;
GRANT SELECT ON public.provider_balances TO authenticated, service_role;

-- 5. Public Contact Messages Table (for /contact page)
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name        text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  email       text NOT NULL CHECK (char_length(trim(email)) BETWEEN 3 AND 160),
  category    text NOT NULL DEFAULT 'Pertanyaan Umum' CHECK (char_length(trim(category)) BETWEEN 1 AND 80),
  message     text NOT NULL CHECK (char_length(trim(message)) BETWEEN 5 AND 4000),
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON public.contact_messages (created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_messages_public_insert" ON public.contact_messages;
CREATE POLICY "contact_messages_public_insert" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(trim(name)) BETWEEN 1 AND 120
    AND char_length(trim(email)) BETWEEN 3 AND 160
    AND char_length(trim(message)) BETWEEN 5 AND 4000
  );

DROP POLICY IF EXISTS "contact_messages_admin_all" ON public.contact_messages;
CREATE POLICY "contact_messages_admin_all" ON public.contact_messages
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
