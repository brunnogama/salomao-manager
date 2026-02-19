-- Fix sequence out of sync for contracts.seq_id
-- This resolves 409 Conflict errors caused by ID collisions, which were mistaken for HON duplicates.

DO $$
DECLARE
    max_id INT;
BEGIN
    -- Find the maximum seq_id currently in use
    SELECT COALESCE(MAX(seq_id), 0) + 1 INTO max_id FROM contracts;

    -- Reset the sequence to the next available number
    -- We assume the sequence is named 'contracts_seq_id_seq' which is standard for serial columns
    -- If it's an identity column, we use proper alteration
    
    -- Check if it's a serial sequence
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'contracts_seq_id_seq') THEN
        PERFORM setval('contracts_seq_id_seq', max_id, false);
    ELSE
        -- If it's an identity column (newer Postgres/Supabase default)
        EXECUTE 'ALTER TABLE contracts ALTER COLUMN seq_id RESTART WITH ' || max_id;
    END IF;
    
    RAISE NOTICE 'Sequence reset to %', max_id;
END $$;
