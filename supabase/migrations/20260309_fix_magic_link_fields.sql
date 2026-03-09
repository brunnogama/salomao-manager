-- Migration: Corrigir campos faltantes na função update_collaborator_by_token
-- e adicionar suporte a snapshot/destaque de alterações do link mágico

-- 1. Adicionar novas colunas para rastreamento de alterações via link mágico
ALTER TABLE public.collaborators
ADD COLUMN IF NOT EXISTS magic_link_snapshot JSONB,
ADD COLUMN IF NOT EXISTS magic_link_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS magic_link_changed_fields JSONB;

-- 2. Recriar a função com os campos faltantes e lógica de snapshot
CREATE OR REPLACE FUNCTION update_collaborator_by_token(p_token UUID, p_data JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old RECORD;
  v_snapshot JSONB;
  v_changed_fields JSONB;
BEGIN
  -- Capturar snapshot dos dados atuais ANTES do update
  SELECT
    name, cpf, rg, birthday, gender, civil_status,
    has_children, children_count, children_data, emergency_contacts,
    zip_code, address, address_number, address_complement, neighborhood, city, state,
    email_pessoal,
    forma_pagamento, banco_nome, banco_tipo_conta, banco_agencia, banco_conta, pix_tipo, pix_chave,
    escolaridade_nivel, escolaridade_subnivel, escolaridade_instituicao,
    escolaridade_matricula, escolaridade_semestre, escolaridade_previsao_conclusao, escolaridade_curso,
    education_history, transportes,
    idiomas, atividades_academicas, pis_pasep, oabs
  INTO v_old
  FROM collaborators
  WHERE update_token = p_token
    AND (update_token_expires_at IS NULL OR update_token_expires_at > NOW());

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Montar snapshot dos valores antigos
  v_snapshot := jsonb_build_object(
    'name', v_old.name,
    'cpf', v_old.cpf,
    'rg', v_old.rg,
    'birthday', v_old.birthday,
    'gender', v_old.gender,
    'civil_status', v_old.civil_status,
    'has_children', v_old.has_children,
    'children_count', v_old.children_count,
    'children_data', v_old.children_data,
    'emergency_contacts', v_old.emergency_contacts,
    'zip_code', v_old.zip_code,
    'address', v_old.address,
    'address_number', v_old.address_number,
    'address_complement', v_old.address_complement,
    'neighborhood', v_old.neighborhood,
    'city', v_old.city,
    'state', v_old.state,
    'email_pessoal', v_old.email_pessoal,
    'forma_pagamento', v_old.forma_pagamento,
    'banco_nome', v_old.banco_nome,
    'banco_tipo_conta', v_old.banco_tipo_conta,
    'banco_agencia', v_old.banco_agencia,
    'banco_conta', v_old.banco_conta,
    'pix_tipo', v_old.pix_tipo,
    'pix_chave', v_old.pix_chave,
    'escolaridade_nivel', v_old.escolaridade_nivel,
    'escolaridade_subnivel', v_old.escolaridade_subnivel,
    'escolaridade_instituicao', v_old.escolaridade_instituicao,
    'escolaridade_matricula', v_old.escolaridade_matricula,
    'escolaridade_semestre', v_old.escolaridade_semestre,
    'escolaridade_previsao_conclusao', v_old.escolaridade_previsao_conclusao,
    'escolaridade_curso', v_old.escolaridade_curso,
    'education_history', v_old.education_history,
    'transportes', v_old.transportes,
    'idiomas', v_old.idiomas,
    'atividades_academicas', v_old.atividades_academicas,
    'pis_pasep', v_old.pis_pasep,
    'oabs', v_old.oabs
  );

  -- Detectar campos alterados comparando valores antigos com novos
  v_changed_fields := '[]'::jsonb;

  IF COALESCE(v_old.name, '') IS DISTINCT FROM COALESCE(p_data->>'name', '') THEN v_changed_fields := v_changed_fields || '"name"'::jsonb; END IF;
  IF COALESCE(v_old.cpf, '') IS DISTINCT FROM COALESCE(p_data->>'cpf', '') THEN v_changed_fields := v_changed_fields || '"cpf"'::jsonb; END IF;
  IF COALESCE(v_old.rg, '') IS DISTINCT FROM COALESCE(p_data->>'rg', '') THEN v_changed_fields := v_changed_fields || '"rg"'::jsonb; END IF;
  IF COALESCE(v_old.birthday::text, '') IS DISTINCT FROM COALESCE(p_data->>'birthday', '') THEN v_changed_fields := v_changed_fields || '"birthday"'::jsonb; END IF;
  IF COALESCE(v_old.gender, '') IS DISTINCT FROM COALESCE(p_data->>'gender', '') THEN v_changed_fields := v_changed_fields || '"gender"'::jsonb; END IF;
  IF COALESCE(v_old.civil_status, '') IS DISTINCT FROM COALESCE(p_data->>'civil_status', '') THEN v_changed_fields := v_changed_fields || '"civil_status"'::jsonb; END IF;
  IF v_old.has_children IS DISTINCT FROM (p_data->>'has_children')::boolean THEN v_changed_fields := v_changed_fields || '"has_children"'::jsonb; END IF;
  IF COALESCE(v_old.children_data::text, '[]') IS DISTINCT FROM COALESCE((p_data->'children_data')::text, '[]') THEN v_changed_fields := v_changed_fields || '"children_data"'::jsonb; END IF;
  IF COALESCE(v_old.emergency_contacts::text, '[]') IS DISTINCT FROM COALESCE((p_data->'emergency_contacts')::text, '[]') THEN v_changed_fields := v_changed_fields || '"emergency_contacts"'::jsonb; END IF;
  IF COALESCE(v_old.zip_code, '') IS DISTINCT FROM COALESCE(p_data->>'zip_code', '') THEN v_changed_fields := v_changed_fields || '"zip_code"'::jsonb; END IF;
  IF COALESCE(v_old.address, '') IS DISTINCT FROM COALESCE(p_data->>'address', '') THEN v_changed_fields := v_changed_fields || '"address"'::jsonb; END IF;
  IF COALESCE(v_old.address_number, '') IS DISTINCT FROM COALESCE(p_data->>'address_number', '') THEN v_changed_fields := v_changed_fields || '"address_number"'::jsonb; END IF;
  IF COALESCE(v_old.address_complement, '') IS DISTINCT FROM COALESCE(p_data->>'address_complement', '') THEN v_changed_fields := v_changed_fields || '"address_complement"'::jsonb; END IF;
  IF COALESCE(v_old.neighborhood, '') IS DISTINCT FROM COALESCE(p_data->>'neighborhood', '') THEN v_changed_fields := v_changed_fields || '"neighborhood"'::jsonb; END IF;
  IF COALESCE(v_old.city, '') IS DISTINCT FROM COALESCE(p_data->>'city', '') THEN v_changed_fields := v_changed_fields || '"city"'::jsonb; END IF;
  IF COALESCE(v_old.state, '') IS DISTINCT FROM COALESCE(p_data->>'state', '') THEN v_changed_fields := v_changed_fields || '"state"'::jsonb; END IF;
  IF COALESCE(v_old.email_pessoal, '') IS DISTINCT FROM COALESCE(p_data->>'email_pessoal', '') THEN v_changed_fields := v_changed_fields || '"email_pessoal"'::jsonb; END IF;
  IF COALESCE(v_old.forma_pagamento, '') IS DISTINCT FROM COALESCE(p_data->>'forma_pagamento', '') THEN v_changed_fields := v_changed_fields || '"forma_pagamento"'::jsonb; END IF;
  IF COALESCE(v_old.banco_nome, '') IS DISTINCT FROM COALESCE(p_data->>'banco_nome', '') THEN v_changed_fields := v_changed_fields || '"banco_nome"'::jsonb; END IF;
  IF COALESCE(v_old.banco_tipo_conta, '') IS DISTINCT FROM COALESCE(p_data->>'banco_tipo_conta', '') THEN v_changed_fields := v_changed_fields || '"banco_tipo_conta"'::jsonb; END IF;
  IF COALESCE(v_old.banco_agencia, '') IS DISTINCT FROM COALESCE(p_data->>'banco_agencia', '') THEN v_changed_fields := v_changed_fields || '"banco_agencia"'::jsonb; END IF;
  IF COALESCE(v_old.banco_conta, '') IS DISTINCT FROM COALESCE(p_data->>'banco_conta', '') THEN v_changed_fields := v_changed_fields || '"banco_conta"'::jsonb; END IF;
  IF COALESCE(v_old.pix_tipo, '') IS DISTINCT FROM COALESCE(p_data->>'pix_tipo', '') THEN v_changed_fields := v_changed_fields || '"pix_tipo"'::jsonb; END IF;
  IF COALESCE(v_old.pix_chave, '') IS DISTINCT FROM COALESCE(p_data->>'pix_chave', '') THEN v_changed_fields := v_changed_fields || '"pix_chave"'::jsonb; END IF;
  IF COALESCE(v_old.education_history::text, '[]') IS DISTINCT FROM COALESCE((p_data->'education_history')::text, '[]') THEN v_changed_fields := v_changed_fields || '"education_history"'::jsonb; END IF;
  IF COALESCE(v_old.transportes::text, '[]') IS DISTINCT FROM COALESCE((p_data->'transportes')::text, '[]') THEN v_changed_fields := v_changed_fields || '"transportes"'::jsonb; END IF;
  IF COALESCE(v_old.idiomas, '') IS DISTINCT FROM COALESCE(p_data->>'idiomas', '') THEN v_changed_fields := v_changed_fields || '"idiomas"'::jsonb; END IF;
  IF COALESCE(v_old.atividades_academicas, '') IS DISTINCT FROM COALESCE(p_data->>'atividades_academicas', '') THEN v_changed_fields := v_changed_fields || '"atividades_academicas"'::jsonb; END IF;
  IF COALESCE(v_old.pis_pasep, '') IS DISTINCT FROM COALESCE(p_data->>'pis_pasep', '') THEN v_changed_fields := v_changed_fields || '"pis_pasep"'::jsonb; END IF;
  IF COALESCE(v_old.oabs::text, '[]') IS DISTINCT FROM COALESCE((p_data->'oabs')::text, '[]') THEN v_changed_fields := v_changed_fields || '"oabs"'::jsonb; END IF;

  UPDATE collaborators
  SET 
    name = p_data->>'name',
    cpf = p_data->>'cpf',
    rg = p_data->>'rg',
    birthday = (p_data->>'birthday')::DATE,
    gender = p_data->>'gender',
    civil_status = p_data->>'civil_status',
    
    -- Filhos
    has_children = (p_data->>'has_children')::BOOLEAN,
    children_count = (p_data->>'children_count')::INTEGER,
    children_data = (p_data->'children_data')::JSONB,
    
    -- Emergência
    emergencia_nome = p_data->>'emergencia_nome',
    emergencia_telefone = p_data->>'emergencia_telefone',
    emergencia_parentesco = p_data->>'emergencia_parentesco',
    emergency_contacts = (p_data->'emergency_contacts')::JSONB,
    
    -- Endereço
    zip_code = p_data->>'zip_code',
    address = p_data->>'address',
    address_number = p_data->>'address_number',
    address_complement = p_data->>'address_complement',
    neighborhood = p_data->>'neighborhood',
    city = p_data->>'city',
    state = p_data->>'state',

    -- Dados Pessoais (Novos)
    email_pessoal = p_data->>'email_pessoal',

    -- Dados Bancários (Novos)
    forma_pagamento = p_data->>'forma_pagamento',
    banco_nome = p_data->>'banco_nome',
    banco_tipo_conta = p_data->>'banco_tipo_conta',
    banco_agencia = p_data->>'banco_agencia',
    banco_conta = p_data->>'banco_conta',
    pix_tipo = p_data->>'pix_tipo',
    pix_chave = p_data->>'pix_chave',

    -- Escolaridade
    escolaridade_nivel = p_data->>'escolaridade_nivel',
    escolaridade_subnivel = p_data->>'escolaridade_subnivel',
    escolaridade_instituicao = p_data->>'escolaridade_instituicao',
    escolaridade_matricula = p_data->>'escolaridade_matricula',
    escolaridade_semestre = p_data->>'escolaridade_semestre',
    escolaridade_previsao_conclusao = (p_data->>'escolaridade_previsao_conclusao')::DATE,
    escolaridade_curso = p_data->>'escolaridade_curso',
    
    -- Múltiplas escolaridades (array)
    education_history = (p_data->'education_history')::JSONB,

    -- Transporte
    transportes = (p_data->'transportes')::JSONB,

    -- Campos faltantes corrigidos
    idiomas = p_data->>'idiomas',
    atividades_academicas = p_data->>'atividades_academicas',
    pis_pasep = p_data->>'pis_pasep',
    oabs = (p_data->'oabs')::JSONB,

    -- Rastreamento de alterações
    magic_link_snapshot = v_snapshot,
    magic_link_updated_at = NOW(),
    magic_link_changed_fields = v_changed_fields,

    -- Finalização do token
    update_token = NULL,
    cadastro_atualizado = true
  WHERE update_token = p_token
    AND (update_token_expires_at IS NULL OR update_token_expires_at > NOW());
END;
$$;
