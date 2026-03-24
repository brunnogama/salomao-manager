ALTER TABLE collaborators
  ADD COLUMN IF NOT EXISTS leader_ids uuid[],
  ADD COLUMN IF NOT EXISTS partner_ids uuid[];

-- Move existing data
UPDATE collaborators
SET leader_ids = ARRAY[leader_id]
WHERE leader_id IS NOT NULL;

UPDATE collaborators
SET partner_ids = ARRAY[partner_id]
WHERE partner_id IS NOT NULL;

-- After verifying the new ui, you can drop the original columns by running:
-- ALTER TABLE collaborators DROP COLUMN leader_id;
-- ALTER TABLE collaborators DROP COLUMN partner_id;
