-- SQL to add missing columns to 'collaborators' table
ALTER TABLE public.collaborators
ADD COLUMN IF NOT EXISTS ctps_numero text,
ADD COLUMN IF NOT EXISTS ctps_serie text,
ADD COLUMN IF NOT EXISTS ctps_uf text,
ADD COLUMN IF NOT EXISTS pis_pasep text,
ADD COLUMN IF NOT EXISTS dispensa_militar text;

-- SQL to add missing columns to 'partners' table (if needed)
ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS ctps_numero text,
ADD COLUMN IF NOT EXISTS ctps_serie text,
ADD COLUMN IF NOT EXISTS ctps_uf text,
ADD COLUMN IF NOT EXISTS pis_pasep text,
ADD COLUMN IF NOT EXISTS dispensa_militar text;
