-- Migration: Add position column to clients table
-- Date: 2026-02-14
-- Description: Adds the 'position' (cargo) column to store client's job position

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS position text;

COMMENT ON COLUMN public.clients.position IS 'Job position/title of the client (cargo)';
