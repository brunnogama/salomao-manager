-- Permite inserir novas instituições de ensino via RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION add_education_institution(p_name TEXT, p_uf TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    INSERT INTO public.education_institutions (name, uf)
    VALUES (p_name, p_uf)
    RETURNING json_build_object('id', id, 'name', name, 'uf', uf) INTO v_result;
    
    RETURN v_result;
END;
$$;
