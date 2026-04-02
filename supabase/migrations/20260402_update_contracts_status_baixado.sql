DO $$ 
DECLARE 
    constraint_name text;
BEGIN
    -- Localiza a constraint de checagem instalada na coluna "status" da tabela "contracts"
    SELECT c.conname INTO constraint_name
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = t.oid
    WHERE t.relname = 'contracts' AND a.attname = 'status' AND c.contype = 'c';

    -- Se achar alguma restrição aplicada, ela é derrubada
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE contracts DROP CONSTRAINT ' || constraint_name;
    END IF;

    -- Cria-se a nova constraint englobando todas as tipagens necessárias, inclusive "baixado"
    ALTER TABLE contracts ADD CONSTRAINT contracts_status_check CHECK (status IN ('analysis', 'proposal', 'active', 'rejected', 'probono', 'baixado'));
END $$;
