DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'opponents' AND column_name = 'cnpj'
    ) THEN
        ALTER TABLE opponents ADD COLUMN cnpj text;
    END IF;
END $$;
