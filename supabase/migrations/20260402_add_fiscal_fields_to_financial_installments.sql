-- Add fiscal and invoicing fields to financial_installments
ALTER TABLE public.financial_installments
  ADD COLUMN IF NOT EXISTS nf_issue_date DATE,
  ADD COLUMN IF NOT EXISTS nf_location BIGINT REFERENCES public.locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS nf_nature TEXT,
  ADD COLUMN IF NOT EXISTS nf_value NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS tax_irpj NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS tax_pis NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS tax_cofins NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS tax_csll NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS net_value NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS nf_number TEXT;
