-- 1. Create a function to format raw numeric CNPJs into standard format
CREATE OR REPLACE FUNCTION format_cnpj_mask(cnpj_input text) RETURNS text AS $$
DECLARE
  clean_cnpj text;
BEGIN
  IF cnpj_input IS NULL THEN
    RETURN NULL;
  END IF;

  -- Remove all non-numeric characters
  clean_cnpj := regexp_replace(cnpj_input, '\D', '', 'g');

  IF length(clean_cnpj) = 14 THEN
    RETURN substring(clean_cnpj, 1, 2) || '.' || 
           substring(clean_cnpj, 3, 3) || '.' || 
           substring(clean_cnpj, 6, 3) || '/' || 
           substring(clean_cnpj, 9, 4) || '-' || 
           substring(clean_cnpj, 13, 2);
  ELSE
    RETURN cnpj_input; -- Return original if not 14 digits (might be CPF or invalid)
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Format all existing CNPJs in the clients table
UPDATE public.clients
SET 
  cnpj = format_cnpj_mask(cnpj)
WHERE 
  cnpj IS NOT NULL 
  AND cnpj <> ''
  AND cnpj NOT LIKE '__.___.___/____-__';

-- 3. Unify client names that share the exact same CNPJ
-- We'll pick the most recently updated name or oldest created name.
-- Using earliest created name as the source of truth.
WITH ranked_clients AS (
  SELECT 
    cnpj,
    name,
    ROW_NUMBER() OVER (PARTITION BY cnpj ORDER BY created_at ASC) as rn
  FROM public.clients
  WHERE cnpj IS NOT NULL AND cnpj <> ''
)
UPDATE public.clients c
SET name = r.name
FROM ranked_clients r
WHERE c.cnpj = r.cnpj AND r.rn = 1 AND c.name <> r.name;
