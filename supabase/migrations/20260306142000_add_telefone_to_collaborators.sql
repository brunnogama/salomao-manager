-- Migration to add 'telefone' to collaborators table
ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS telefone TEXT;
