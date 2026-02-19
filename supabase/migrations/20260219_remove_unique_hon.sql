-- Remove unique constraint on hon_number in contracts table
-- This allows multiple contracts to have the same HON number as requested.

DO $$
BEGIN
  -- Attempt to drop the constraint if it exists
  -- The constraint name is usually 'contracts_hon_number_key' but we'll check just in case
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'contracts_hon_number_key'
  ) THEN
    ALTER TABLE contracts DROP CONSTRAINT contracts_hon_number_key;
  END IF;

  -- Also check for any unique index that might not be a constraint
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'contracts_hon_number_key'
  ) THEN
    DROP INDEX contracts_hon_number_key;
  END IF;

END $$;
