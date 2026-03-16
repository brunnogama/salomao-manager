-- 1. Create a function to format raw numeric CNPJs into standard format
CREATE OR REPLACE FUNCTION format_cnpj_mask(cnpj_input text) RETURNS text AS $$
DECLARE
  clean_cnpj text;
BEGIN
  IF cnpj_input IS NULL THEN
    RETURN NULL;
  END IF;

  clean_cnpj := regexp_replace(cnpj_input, '\D', '', 'g');

  IF length(clean_cnpj) = 14 THEN
    RETURN substring(clean_cnpj, 1, 2) || '.' || 
           substring(clean_cnpj, 3, 3) || '.' || 
           substring(clean_cnpj, 6, 3) || '/' || 
           substring(clean_cnpj, 9, 4) || '-' || 
           substring(clean_cnpj, 13, 2);
  ELSE
    RETURN cnpj_input;
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

-- 3. CÓDIGO MELHORADO: Unificar e fundir os registros com CNPJ duplicado (mantendo só o mais antigo)
DO $$
DECLARE
    r RECORD;
    primary_id UUID;
    primary_name TEXT;
BEGIN
    -- Itera sobre cada CNPJ que tem mais de 1 registro associado
    FOR r IN (
        SELECT cnpj, count(*) as c
        FROM public.clients
        WHERE cnpj IS NOT NULL AND cnpj <> ''
        GROUP BY cnpj
        HAVING count(*) > 1
    ) LOOP
        
        -- Pegar o ID principal (o registro criado primeiro) para esse CNPJ
        SELECT id, name INTO primary_id, primary_name
        FROM public.clients
        WHERE cnpj = r.cnpj
        ORDER BY created_at ASC
        LIMIT 1;

        -- 1. Atualizar CONTRATOS com o ID do cliente principal (+ ajustar o nome do cliente no contrato)
        UPDATE public.contracts
        SET client_id = primary_id, client_name = primary_name
        WHERE client_id IN (
            SELECT id FROM public.clients WHERE cnpj = r.cnpj AND id <> primary_id
        );

        -- 2. Atualizar CONTATOS com o ID do cliente principal
        UPDATE public.client_contacts
        SET client_id = primary_id
        WHERE client_id IN (
            SELECT id FROM public.clients WHERE cnpj = r.cnpj AND id <> primary_id
        );

        -- 3. Deletar as duplicatas!
        DELETE FROM public.clients
        WHERE cnpj = r.cnpj AND id <> primary_id;
        
    END LOOP;
END $$;
