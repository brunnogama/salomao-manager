-- Add competencias column to collaborators if it doesn't already exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' 
                   AND table_name='collaborators' 
                   AND column_name='competencias') THEN
        ALTER TABLE public.collaborators ADD COLUMN competencias TEXT;
    END IF;
END $$;
