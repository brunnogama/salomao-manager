CREATE OR REPLACE FUNCTION update_collaborator_by_token(p_token UUID, p_data JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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

    -- Transporte (Adicionado para atualizar array de transportes)
    transportes = (p_data->'transportes')::JSONB,

    -- Finalização do token
    update_token = NULL,
    cadastro_atualizado = true
  WHERE update_token = p_token
    AND (update_token_expires_at IS NULL OR update_token_expires_at > NOW());
END;
$$;
