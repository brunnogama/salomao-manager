-- Function to check for duplicate HON numbers bypassing RLS
-- This allows checking if a HON number exists even if the user cannot see the contract (e.g. rejected/archived)

CREATE OR REPLACE FUNCTION check_contract_duplicate_hon(hon_input TEXT, exclude_id UUID DEFAULT NULL)
RETURNS TABLE (id UUID, client_name TEXT, display_id TEXT, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.client_name, c.display_id, c.status::TEXT
  FROM contracts c
  WHERE c.hon_number = hon_input
  AND (exclude_id IS NULL OR c.id != exclude_id);
END;
$$;
