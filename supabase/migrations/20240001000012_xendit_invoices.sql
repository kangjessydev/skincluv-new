-- Migration 012: Xendit Invoices

CREATE TABLE IF NOT EXISTS public.xendit_invoices (
  id             text        PRIMARY KEY, -- Xendit Invoice ID
  user_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_idr     integer     NOT NULL,
  coin_amount    integer     NOT NULL,
  status         text        NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, EXPIRED
  invoice_url    text        NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.xendit_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "xendit_invoices_select_own" 
  ON public.xendit_invoices 
  FOR SELECT USING (auth.uid() = user_id);
