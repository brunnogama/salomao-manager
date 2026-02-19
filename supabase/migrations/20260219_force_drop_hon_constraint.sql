-- Force remove ANY unique constraint or index on hon_number in contracts table
-- This script dynamically finds the constraint name and drops it.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Drop unknown unique CONSTRAINTS on hon_number
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'contracts'::regclass 
        AND contype = 'u'  -- Unique constraint
        AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'contracts'::regclass AND attname = 'hon_number')]
    ) LOOP
        EXECUTE 'ALTER TABLE contracts DROP CONSTRAINT ' || r.conname;
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;

    -- 2. Drop unknown unique INDEXES on hon_number (that aren't constraints)
    FOR r IN (
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'contracts' 
        AND indexdef LIKE '%(hon_number)%'
        AND indexdef LIKE '%UNIQUE%'
    ) LOOP
        EXECUTE 'DROP INDEX ' || r.indexname;
        RAISE NOTICE 'Dropped index: %', r.indexname;
    END LOOP;

END $$;
