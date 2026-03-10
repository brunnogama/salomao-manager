-- 1. Create a function to fetch the candidate profile and documents securely
CREATE OR REPLACE FUNCTION get_candidato_public_profile(p_candidato_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidato RECORD;
  v_documentos JSON;
  v_experiencias JSON;
  v_resultado JSON;
BEGIN
  -- Search for the candidate
  SELECT 
    id,
    nome,
    email,
    telefone,
    linkedin,
    resumo_cv,
    perfil,
    role,
    local,
    area,
    idiomas,
    atividades_academicas,
    photo_url,
    foto_url,
    city,
    state,
    education_history,
    candidato_id_text
  INTO v_candidato
  FROM candidatos
  WHERE id = p_candidato_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidato não encontrado';
  END IF;

  -- Get candidate documents
  SELECT json_agg(
    json_build_object(
      'id', id,
      'nome_arquivo', nome_arquivo,
      'categoria', categoria,
      'tamanho', tamanho,
      'url', url
    )
  ) INTO v_documentos
  FROM candidato_ged
  WHERE candidato_id = p_candidato_id;

  -- Get candidate experiences
  SELECT json_agg(
    json_build_object(
      'id', id,
      'empresa', empresa,
      'cargo', cargo,
      'data_inicio', data_inicio,
      'data_fim', data_fim,
      'perfil', perfil
    )
  ) INTO v_experiencias
  FROM candidato_experiencias
  WHERE candidato_id = p_candidato_id;

  -- Build final JSON result
  v_resultado := json_build_object(
    'candidato', json_build_object(
      'id', v_candidato.id,
      'nome', v_candidato.nome,
      'email', v_candidato.email,
      'telefone', v_candidato.telefone,
      'linkedin', v_candidato.linkedin,
      'resumo_cv', v_candidato.resumo_cv,
      'perfil', v_candidato.perfil,
      'role', v_candidato.role,
      'local', v_candidato.local,
      'area', v_candidato.area,
      'idiomas', v_candidato.idiomas,
      'atividades_academicas', v_candidato.atividades_academicas,
      'photo_url', COALESCE(v_candidato.photo_url, v_candidato.foto_url),
      'city', v_candidato.city,
      'state', v_candidato.state,
      'education_history', v_candidato.education_history,
      'candidato_id_text', v_candidato.candidato_id_text
    ),
    'documentos', COALESCE(v_documentos, '[]'::json),
    'experiencias', COALESCE(v_experiencias, '[]'::json)
  );

  RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;
