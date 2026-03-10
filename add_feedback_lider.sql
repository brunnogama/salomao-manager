-- 1. Add new columns to candidatos table for leader feedback
ALTER TABLE public.candidatos 
ADD COLUMN IF NOT EXISTS avaliacao_lider text,
ADD COLUMN IF NOT EXISTS obs_lider text,
ADD COLUMN IF NOT EXISTS data_avaliacao timestamptz;

-- 2. Create the secure RPC to save leader feedback without authentication
CREATE OR REPLACE FUNCTION save_candidato_feedback(
    p_candidato_id UUID,
    p_avaliacao TEXT,
    p_obs TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if candidato exists
    IF NOT EXISTS (SELECT 1 FROM candidatos WHERE id = p_candidato_id) THEN
        RAISE EXCEPTION 'Candidato não encontrado';
    END IF;

    -- Update the candidate record
    UPDATE candidatos
    SET 
        avaliacao_lider = p_avaliacao,
        obs_lider = p_obs,
        data_avaliacao = NOW()
    WHERE id = p_candidato_id;

    -- Insert into history
    INSERT INTO candidato_historico (
        candidato_id,
        tipo,
        data_registro,
        observacoes,
        created_at
    ) VALUES (
        p_candidato_id,
        'Avaliação do Líder',
        NOW(),
        'Avaliação: ' || p_avaliacao || '. Observação: ' || COALESCE(p_obs, ''),
        NOW()
    );

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao salvar avaliação: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 3. Update the existing get_candidato_public_profile to fetch these new columns
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
    candidato_id_text,
    entrevista_dados,
    avaliacao_lider,
    obs_lider,
    data_avaliacao
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
      'candidato_id_text', v_candidato.candidato_id_text,
      'entrevista_dados', COALESCE(v_candidato.entrevista_dados, '{}'::jsonb),
      'avaliacao_lider', v_candidato.avaliacao_lider,
      'obs_lider', v_candidato.obs_lider,
      'data_avaliacao', v_candidato.data_avaliacao
    ),
    'documentos', COALESCE(v_documentos, '[]'::json),
    'experiencias', COALESCE(v_experiencias, '[]'::json)
  );

  RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;
