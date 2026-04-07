-- Add nf_access_key field to financial_installments
ALTER TABLE public.financial_installments 
ADD COLUMN IF NOT EXISTS nf_access_key TEXT;
