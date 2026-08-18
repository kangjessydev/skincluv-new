-- ============================================================
-- Migration 017: Tripay Invoices Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tripay_invoices (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_ref  text        NOT NULL UNIQUE,
  reference     text        UNIQUE,
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_idr    integer     NOT NULL,
  plan          text        NOT NULL DEFAULT 'PREMIUM',
  status        text        NOT NULL DEFAULT 'UNPAID'
                            CHECK (status IN ('UNPAID','PAID','FAILED','REFUND')),
  checkout_url  text,
  pay_url       text,
  qr_url        text,
  expired_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.tripay_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tripay_invoices_select_own" ON public.tripay_invoices;
CREATE POLICY "tripay_invoices_select_own" ON public.tripay_invoices
  FOR SELECT USING (auth.uid() = user_id);

-- Auto updated_at
DROP TRIGGER IF EXISTS tripay_invoices_updated_at ON public.tripay_invoices;
CREATE TRIGGER tripay_invoices_updated_at
  BEFORE UPDATE ON public.tripay_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
