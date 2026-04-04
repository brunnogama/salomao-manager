-- Remove any existing CHECK constraint that restricts the `status` column values
ALTER TABLE public.financial_installments
DROP CONSTRAINT IF EXISTS financial_installments_status_check;

-- Ensure status is TEXT and has the appropriate value set (this is handled in application logic mostly, but if we want we could add a new CHECK constraint, we omitted it here to avoid blocking variations implicitly, as often enforced by application and TS types)
