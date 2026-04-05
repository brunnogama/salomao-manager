-- 1. ADD COLUMNS
ALTER TABLE clients ADD COLUMN IF NOT EXISTS seq_id SERIAL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS display_id TEXT;

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_seq_val INTEGER;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS display_id TEXT;

ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS display_id TEXT;

-- 2. UPDATE CLIENTS (Set display_id to CLI - XXX)
UPDATE clients SET display_id = 'CLI - ' || LPAD(seq_id::text, 3, '0') WHERE display_id IS NULL;

-- 3. UPDATE CONTRACTS (Determine client_seq_val by row_number per client)
WITH ranked_contracts AS (
  SELECT id,
         client_id,
         ROW_NUMBER() OVER(PARTITION BY client_id ORDER BY created_at ASC) as rnk
  FROM contracts
)
UPDATE contracts c
SET client_seq_val = r.rnk
FROM ranked_contracts r
WHERE c.id = r.id AND c.client_seq_val IS NULL;

-- 4. UPDATE CONTRACTS display_id (CONT - XXX-YYY)
UPDATE contracts c
SET display_id = 'CONT - ' || LPAD(cl.seq_id::text, 3, '0') || '-' || LPAD(c.client_seq_val::text, 3, '0')
FROM clients cl
WHERE c.client_id = cl.id AND c.display_id IS NULL;

-- 5. UPDATE FINANCIAL_INSTALLMENTS display_id (CONT - XXX-YYY.ZZ)
WITH ranked_installments AS (
  SELECT id,
         contract_id,
         ROW_NUMBER() OVER(PARTITION BY contract_id ORDER BY created_at ASC, id ASC) as rnk
  FROM financial_installments
)
UPDATE financial_installments f
SET display_id = c.display_id || '.' || LPAD(r.rnk::text, 2, '0')
FROM ranked_installments r, contracts c
WHERE f.id = r.id AND f.contract_id = c.id;
