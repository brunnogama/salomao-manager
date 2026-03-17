-- Migration: Update Sucumbencias Table Status Constraint
-- Description: Updates the CHECK constraint on the status column to allow 'potencial', 'prescrito', and 'recebido' in addition to 'verificado' and 'descartado'.

ALTER TABLE public.sucumbencias DROP CONSTRAINT IF EXISTS sucumbencias_status_check;

ALTER TABLE public.sucumbencias ADD CONSTRAINT sucumbencias_status_check
CHECK (status IN ('potencial', 'verificado', 'descartado', 'prescrito', 'recebido'));
