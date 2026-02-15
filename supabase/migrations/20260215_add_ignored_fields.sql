-- Migration: Add ignored_fields to client_contacts
-- Date: 2026-02-15
-- Description: Adds a text array column to store ignored mandatory fields for incomplete contacts logic.

ALTER TABLE public.client_contacts
ADD COLUMN IF NOT EXISTS ignored_fields text[] DEFAULT '{}';

COMMENT ON COLUMN public.client_contacts.ignored_fields IS 'List of mandatory fields to ignore for incomplete profile calculation';
