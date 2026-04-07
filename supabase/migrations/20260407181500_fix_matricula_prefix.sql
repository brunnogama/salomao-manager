-- Migration: Fix collaborator prefix from COL to INT
CREATE OR REPLACE FUNCTION public.generate_collaborator_matricula()
 RETURNS trigger
 LANGUAGE plpgsql
AS $$
DECLARE
    next_val INT;
BEGIN
    IF NEW.matricula_interna IS NULL THEN
        next_val := nextval('collaborator_matricula_seq');
        NEW.matricula_interna := 'INT - ' || LPAD(next_val::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$;
