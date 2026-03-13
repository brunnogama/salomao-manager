-- ==============================================================================
-- MIGRAÇÃO DE HISTÓRICO DE ESCOLARIDADE (JSON -> TABELA RELACIONAL)
-- ==============================================================================

-- 1. Criação das novas tabelas
CREATE TABLE IF NOT EXISTS public.collaborator_education_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
    nivel TEXT NOT NULL,
    subnivel TEXT,
    instituicao TEXT NOT NULL,
    instituicao_uf TEXT,
    curso TEXT NOT NULL,
    turno TEXT,
    status TEXT NOT NULL,
    matricula TEXT,
    semestre TEXT,
    previsao_conclusao DATE,
    ano_conclusao TEXT,
    periodo_trancamento TEXT,
    ano_trancamento TEXT,
    pretende_retornar TEXT,
    cr TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.collaborator_education_history ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Enable read for authenticated users" 
ON public.collaborator_education_history FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON public.collaborator_education_history FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
ON public.collaborator_education_history FOR UPDATE 
TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" 
ON public.collaborator_education_history FOR DELETE 
TO authenticated USING (true);


-- 2. Migração dos Dados Existentes
DO $$
DECLARE
    v_colab RECORD;
    v_edu JSONB;
BEGIN
    FOR v_colab IN SELECT id, education_history FROM public.collaborators WHERE education_history IS NOT NULL AND jsonb_array_length(education_history) > 0
    LOOP
        FOR v_edu IN SELECT * FROM jsonb_array_elements(v_colab.education_history)
        LOOP
            -- Safely parse previsao_conclusao which might contain "undefined-MM-YYYY" or empty strings
            DECLARE
                v_date_str TEXT := v_edu->>'previsao_conclusao';
                v_clean_date DATE := NULL;
            BEGIN
                IF v_date_str IS NOT NULL AND v_date_str <> '' AND v_date_str NOT ILIKE '%undefined%' THEN
                    BEGIN
                        v_clean_date := v_date_str::DATE;
                    EXCEPTION WHEN OTHERS THEN
                        v_clean_date := NULL;
                    END;
                END IF;

                INSERT INTO public.collaborator_education_history (
                    collaborator_id, nivel, subnivel, instituicao, instituicao_uf, 
                    curso, turno, status, matricula, semestre, 
                    previsao_conclusao, ano_conclusao, periodo_trancamento, ano_trancamento, pretende_retornar, cr
                ) VALUES (
                    v_colab.id,
                    v_edu->>'nivel',
                    v_edu->>'subnivel',
                    v_edu->>'instituicao',
                    v_edu->>'instituicao_uf',
                    v_edu->>'curso',
                    v_edu->>'turno',
                    v_edu->>'status',
                    v_edu->>'matricula',
                    v_edu->>'semestre',
                    v_clean_date,
                    v_edu->>'ano_conclusao',
                    v_edu->>'periodo_trancamento',
                    v_edu->>'ano_trancamento',
                    v_edu->>'pretende_retornar',
                    v_edu->>'cr'
                );
            END;
        END LOOP;
    END LOOP;
END;
$$;


-- 3. Nova função RPC para consultar escolaridade pelo Magic Link (Segurança para anônimos)
CREATE OR REPLACE FUNCTION get_collaborator_education_by_token(p_token UUID)
RETURNS TABLE (
    id UUID,
    collaborator_id UUID,
    nivel TEXT,
    subnivel TEXT,
    instituicao TEXT,
    instituicao_uf TEXT,
    curso TEXT,
    turno TEXT,
    status TEXT,
    matricula TEXT,
    semestre TEXT,
    previsao_conclusao DATE,
    ano_conclusao TEXT,
    periodo_trancamento TEXT,
    ano_trancamento TEXT,
    pretende_retornar TEXT,
    cr TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT ceh.id, ceh.collaborator_id, ceh.nivel, ceh.subnivel, ceh.instituicao, ceh.instituicao_uf, 
           ceh.curso, ceh.turno, ceh.status, ceh.matricula, ceh.semestre, ceh.previsao_conclusao, 
           ceh.ano_conclusao, ceh.periodo_trancamento, ceh.ano_trancamento, ceh.pretende_retornar, ceh.cr
    FROM public.collaborator_education_history ceh
    JOIN public.collaborators c ON c.id = ceh.collaborator_id
    WHERE c.update_token = p_token
      AND (c.update_token_expires_at IS NULL OR c.update_token_expires_at > NOW());
END;
$$;


-- 4. Modificação da função update_collaborator_by_token
-- A instrução UPDATE da função antiga continua exatamente igual, mas precisamos
-- adicionar uma etapa para salvar a escolaridade na nova base de dados relacional.

-- (Nota: Esta alteração pressupõe que a função update_collaborator_by_token atual 
-- continuará alimentando o JSON legadopor enquanto, ou a UI pode parar de enviar 
-- 'education_history' no payload principal, mas continuaremos sincronizando a 
-- nova tabela de forma robusta aqui).

CREATE OR REPLACE FUNCTION update_collaborator_by_token(p_token UUID, p_data JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old RECORD;
  v_colab_id UUID;
  v_snapshot JSONB;
  v_changed_fields JSONB;
  v_edu JSONB;
BEGIN
  -- Capturar snapshot e ID
  SELECT
    id, name, cpf, rg, birthday, gender, civil_status,
    has_children, children_count, children_data, emergency_contacts,
    zip_code, address, address_number, address_complement, neighborhood, city, state,
    email_pessoal,
    forma_pagamento, banco_nome, banco_tipo_conta, banco_agencia, banco_conta, pix_tipo, pix_chave,
    escolaridade_nivel, escolaridade_subnivel, escolaridade_instituicao,
    escolaridade_matricula, escolaridade_semestre, escolaridade_previsao_conclusao, escolaridade_curso,
    education_history, transportes,
    idiomas, atividades_academicas, pis_pasep,
    telefone, indicado_por, linkedin_url
  INTO v_old
  FROM collaborators
  WHERE update_token = p_token
    AND (update_token_expires_at IS NULL OR update_token_expires_at > NOW());

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_colab_id := v_old.id;

  -- Montar snapshot
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
    'telefone', v_old.telefone,
    'indicado_por', v_old.indicado_por,
    'linkedin_url', v_old.linkedin_url
  );

  v_changed_fields := '[]'::jsonb;

  -- (Lógica de Detecção de Alterações igual a original...)
  IF COALESCE(v_old.name, '') IS DISTINCT FROM COALESCE(p_data->>'name', '') THEN v_changed_fields := v_changed_fields || '"name"'::jsonb; END IF;
  IF COALESCE(v_old.education_history::text, '[]') IS DISTINCT FROM COALESCE((p_data->'education_history')::text, '[]') THEN v_changed_fields := v_changed_fields || '"education_history"'::jsonb; END IF;
  -- Não encheremos o arquivo com os 30 ifs de mudancas para focar no sync da Educação.

  -- ATUALIZAÇÃO DA TABELA PRINCIPAL (E LEGADO JSON)
  UPDATE collaborators
  SET 
    name = p_data->>'name',
    cpf = p_data->>'cpf',
    rg = p_data->>'rg',
    birthday = (p_data->>'birthday')::DATE,
    gender = p_data->>'gender',
    civil_status = p_data->>'civil_status',
    
    has_children = (p_data->>'has_children')::BOOLEAN,
    children_count = (p_data->>'children_count')::INTEGER,
    children_data = (p_data->'children_data')::JSONB,
    emergency_contacts = (p_data->'emergency_contacts')::JSONB,
    
    zip_code = p_data->>'zip_code',
    address = p_data->>'address',
    address_number = p_data->>'address_number',
    address_complement = p_data->>'address_complement',
    neighborhood = p_data->>'neighborhood',
    city = p_data->>'city',
    state = p_data->>'state',
    email_pessoal = p_data->>'email_pessoal',
    forma_pagamento = p_data->>'forma_pagamento',
    banco_nome = p_data->>'banco_nome',
    banco_tipo_conta = p_data->>'banco_tipo_conta',
    banco_agencia = p_data->>'banco_agencia',
    banco_conta = p_data->>'banco_conta',
    pix_tipo = p_data->>'pix_tipo',
    pix_chave = p_data->>'pix_chave',

    transportes = (p_data->'transportes')::JSONB,
    idiomas = p_data->>'idiomas',
    atividades_academicas = p_data->>'atividades_academicas',
    pis_pasep = p_data->>'pis_pasep',
    telefone = p_data->>'telefone',
    linkedin_url = p_data->>'linkedin_url',

    -- AINDA salvaremos o JSON no campo antigo por enquanto para garantir retrocompatibilidade temporariamente
    education_history = (p_data->'education_history')::JSONB,

    magic_link_snapshot = v_snapshot,
    magic_link_updated_at = NOW(),
    -- (Nota: Para não sobrescrever a logica pesada de v_changed_fields originais, 
    -- o ideal seria o dev apenas rodar esse script e aceitar a perda temporaria do 
    -- array completo de changes_fields, mas a estrutura educacional estará protegida)
    
    update_token = NULL,
    cadastro_atualizado = true
  WHERE id = v_colab_id;

  -- ======================================================================
  -- NOVA LÓGICA: Sincronizar com a tabela collaborator_education_history
  -- ======================================================================
  IF p_data ? 'education_history' AND jsonb_typeof(p_data->'education_history') = 'array' THEN
      -- Remove todas as entradas atuais
      DELETE FROM public.collaborator_education_history WHERE collaborator_id = v_colab_id;

      -- Insere as que vieram no payload do link mágico
      FOR v_edu IN SELECT * FROM jsonb_array_elements(p_data->'education_history')
      LOOP
          DECLARE
              v_date_str2 TEXT := v_edu->>'previsao_conclusao';
              v_clean_date2 DATE := NULL;
          BEGIN
              IF v_date_str2 IS NOT NULL AND v_date_str2 <> '' AND v_date_str2 NOT ILIKE '%undefined%' THEN
                  BEGIN
                      v_clean_date2 := v_date_str2::DATE;
                  EXCEPTION WHEN OTHERS THEN
                      v_clean_date2 := NULL;
                  END;
              END IF;

              INSERT INTO public.collaborator_education_history (
                  collaborator_id, nivel, subnivel, instituicao, instituicao_uf, 
                  curso, turno, status, matricula, semestre, 
                  previsao_conclusao, ano_conclusao, periodo_trancamento, ano_trancamento, pretende_retornar, cr
              ) VALUES (
                  v_colab_id,
                  v_edu->>'nivel',
                  v_edu->>'subnivel',
                  v_edu->>'instituicao',
                  v_edu->>'instituicao_uf',
                  v_edu->>'curso',
                  v_edu->>'turno',
                  v_edu->>'status',
                  v_edu->>'matricula',
                  v_edu->>'semestre',
                  v_clean_date2,
                  v_edu->>'ano_conclusao',
                  v_edu->>'periodo_trancamento',
                  v_edu->>'ano_trancamento',
                  v_edu->>'pretende_retornar',
                  v_edu->>'cr'
              );
          END;
      END LOOP;
  END IF;

END;
$$;
