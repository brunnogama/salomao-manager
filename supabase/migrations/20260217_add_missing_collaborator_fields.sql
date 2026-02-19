-- Add missing columns to collaborators table to match frontend fields
ALTER TABLE public.collaborators
ADD COLUMN IF NOT EXISTS civil_status text,
ADD COLUMN IF NOT EXISTS nacionalidade text,
ADD COLUMN IF NOT EXISTS naturalidade_cidade text,
ADD COLUMN IF NOT EXISTS naturalidade_uf text,
ADD COLUMN IF NOT EXISTS mae text,
ADD COLUMN IF NOT EXISTS pai text,
ADD COLUMN IF NOT EXISTS cnh text,
ADD COLUMN IF NOT EXISTS tituloseleitor text,
ADD COLUMN IF NOT EXISTS reservista text,
ADD COLUMN IF NOT EXISTS oab_tipo text,
ADD COLUMN IF NOT EXISTS has_children boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS children_count integer DEFAULT 0;
