-- Migration: Create Exit Interview Tables

CREATE TABLE IF NOT EXISTS form_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    vinculo_type VARCHAR(255) NOT NULL,
    schema JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exit_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collaborator_id UUID REFERENCES collaborators(id) ON DELETE CASCADE,
    template_id UUID REFERENCES form_templates(id),
    token UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    answers JSONB DEFAULT '{}'::jsonb,
    rh_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_interviews ENABLE ROW LEVEL SECURITY;

-- Form Templates RLS
CREATE POLICY "Enable read access for all users" ON "public"."form_templates"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."form_templates"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON "public"."form_templates"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Exit Interviews RLS
CREATE POLICY "Enable insert for authenticated users only" ON "public"."exit_interviews"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON "public"."exit_interviews"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update for authenticated users" ON "public"."exit_interviews"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Permissão anônima para ler apenas dados usando o token
CREATE POLICY "Allow public read of specific interview by token" ON "public"."exit_interviews"
AS PERMISSIVE FOR SELECT
TO anon
USING (token IS NOT NULL);

-- Permissão anônima para atualizar as respostas usando o token
CREATE POLICY "Allow public update of specific interview by token" ON "public"."exit_interviews"
AS PERMISSIVE FOR UPDATE
TO anon
USING (token IS NOT NULL AND status = 'pending')
WITH CHECK (token IS NOT NULL);

-- Seed initial template
INSERT INTO form_templates (name, vinculo_type, schema) VALUES (
    'Formulário de Desligamento - Estagiários',
    'Estagiário',
    '[
  {
    "id": "sec_motivo",
    "title": "Motivo do Desligamento",
    "questions": [
      {
        "id": "q1",
        "type": "radio",
        "label": "1. Qual foi o principal fator que levou a sua saída do Salomão Advogados?",
        "options": [
          "Melhor proposta de trabalho", "Mudança na minha escolha profissional", "Dificuldades de relacionamento com o líder", "Intercâmbio/curso", "Não alinhamento com a cultura do escritório e equipe", "Outros"
        ]
      },
      {
        "id": "q2",
        "type": "checkbox",
        "label": "Marque a opção que melhor define sua decisão",
        "dependsOn": {
          "questionId": "q1",
          "value": "Melhor proposta de trabalho"
        },
        "options": [
          "Melhor remuneração", "Melhores benefícios", "Bolsa auxílio extra de fim de ano", "Outros"
        ]
      }
    ]
  },
  {
    "id": "sec_avaliacao",
    "title": "Avaliação",
    "description": "Assinale abaixo a sua avaliação quanto aos itens mencionados",
    "questions": [
      {
         "id": "grid_lider",
         "type": "grid",
         "label": "Relacionamento com o líder",
         "options": ["Muito satisfeito", "Satisfeito", "Insatisfeito", "Muito insatisfeito"],
         "items": [
           {"id": "lider_qualidade", "label": "Qualidade de relacionamento com o líder"},
           {"id": "lider_repasse", "label": "Repasse das informações e/ou orientações que facilitavam a realização do seu trabalho"},
           {"id": "lider_feedback", "label": "Recebi feedbacks do líder sobre suas atividades realizadas"}
         ],
         "has_comments": true
      },
      {
         "id": "grid_ambiente",
         "type": "grid",
         "label": "Ambiente",
         "options": ["Muito satisfeito", "Satisfeito", "Insatisfeito", "Muito insatisfeito"],
         "items": [
           {"id": "ambiente_condicoes", "label": "Condições de trabalho (higiene, móveis e instalações, iluminação)"},
           {"id": "ambiente_ti", "label": "Infraestrutura de TI"}
         ],
         "has_comments": true
      },
      {
         "id": "grid_comunicacao",
         "type": "grid",
         "label": "Comunicação interna e relacionamento interpessoais",
         "options": ["Muito satisfeito", "Satisfeito", "Insatisfeito", "Muito insatisfeito"],
         "items": [
           {"id": "com_equipe", "label": "Avalie o relacionamento entre os integrantes da sua equipe"},
           {"id": "com_areas", "label": "Avalie o relacionamento com as outras áreas"},
           {"id": "com_metas", "label": "Comunicação de metas e objetivos da sua área"},
           {"id": "com_reunioes", "label": "Participou de reuniões suficientes para que pudesse trocar ideias e dar sugestões"}
         ],
         "has_comments": true
      },
      {
         "id": "grid_desenvolvimento",
         "type": "grid",
         "label": "Desenvolvimento profissional",
         "options": ["Muito satisfeito", "Satisfeito", "Insatisfeito", "Muito insatisfeito"],
         "items": [
           {"id": "dev_oportunidades", "label": "Foram dadas oportunidades de executar atividades diversas daquelas desenvolvidas na sua rotina"},
           {"id": "dev_profissional", "label": "Obteve oportunidade de se desenvolver profissionalmente"}
         ],
         "has_comments": true
      },
      {
         "id": "grid_atendimento",
         "type": "grid",
         "label": "Avalie o atendimento das áreas administrativas",
         "options": ["Muito satisfeito", "Satisfeito", "Insatisfeito", "Muito insatisfeito"],
         "items": [
           {"id": "adm_ti", "label": "TI - Tecnologia da Informação"},
           {"id": "adm_fin", "label": "Financeiro"},
           {"id": "adm_rh", "label": "Recursos Humanos"},
           {"id": "adm_recepcao", "label": "Setor administrativo (recepção, facilites, copa, etc)"}
         ],
         "has_comments": true
      },
      {
         "id": "grid_beneficios",
         "type": "grid",
         "label": "Itens de Benefícios",
         "options": ["Muito satisfeito", "Satisfeito", "Insatisfeito", "Muito insatisfeito"],
         "items": [
           {"id": "ben_seguro", "label": "Seguro de Vida"},
           {"id": "ben_bolsa", "label": "Bolsa Auxílio"},
           {"id": "ben_vr", "label": "Auxílio Vale Refeição"},
           {"id": "ben_vt", "label": "Auxílio Transporte"},
           {"id": "ben_parcerias", "label": "Parcerias e Convênios"},
           {"id": "ben_totalpass", "label": "TotalPass"},
           {"id": "ben_hibrido", "label": "Regime híbrido"},
           {"id": "ben_recesso", "label": "Recesso remunerado"},
           {"id": "ben_eventos", "label": "Eventos internos"}
         ],
         "has_comments": true
      }
    ]
  },
  {
    "id": "sec_finais",
    "title": "Considerações Finais",
    "questions": [
      {
        "id": "prioridade_beneficios",
        "type": "textarea",
        "label": "Cite e enumere por ordem de prioridade os benefícios que gostaria de ter recebido"
      },
      {
        "id": "expectativas_atingidas",
        "type": "radio",
        "label": "Suas expectativas quanto ao escritório foram atingidas?",
        "options": ["Sim", "Não"]
      },
      {
        "id": "expectativas_pq",
        "type": "text",
        "label": "Por que?"
      },
      {
        "id": "voltaria_trabalhar",
        "type": "radio",
        "label": "Voltaria a trabalhar conosco?",
        "options": ["Sim", "Não"]
      },
      {
        "id": "aspecto_positivo",
        "type": "radio",
        "label": "Assinale dentre os itens abaixo o principal aspecto positivo do escritório (apenas 1 opção)",
        "options": ["Ambiente de trabalho", "Aprendizado", "Estrutura física", "Reconhecimento profissional", "Reconhecimento do escritório no mercado", "Outros"]
      },
      {
        "id": "aspectos_positivo_quais",
        "type": "text",
        "label": "Quais?",
        "dependsOn": {
          "questionId": "aspecto_positivo",
          "value": "Outros"
        }
      },
      {
        "id": "aspectos_melhorar",
        "type": "textarea",
        "label": "Quais os aspectos que você acredita que devem ser melhorados?"
      }
    ]
  },
  {
    "id": "sec_rh",
    "title": "Uso Exclusivo do RH",
    "description": "Seção reservada para anotações do entrevistador.",
    "questions": [
      {
        "id": "rh_notes",
        "type": "textarea",
        "label": "Observações do RH (entrevistador)"
      }
    ]
  }
]'::jsonb
);

CREATE OR REPLACE FUNCTION get_exit_interview_public(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_interview exit_interviews%ROWTYPE;
    v_template form_templates%ROWTYPE;
    v_collaborator collaborators%ROWTYPE;
    v_role roles%ROWTYPE;
    v_result JSONB;
BEGIN
    SELECT * INTO v_interview FROM exit_interviews WHERE token = p_token;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT * INTO v_template FROM form_templates WHERE id = v_interview.template_id;
    SELECT * INTO v_collaborator FROM collaborators WHERE id = v_interview.collaborator_id;
    SELECT * INTO v_role FROM roles WHERE id::TEXT = v_collaborator.role::TEXT;

    v_result = jsonb_build_object(
        'interview_id', v_interview.id,
        'status', v_interview.status,
        'answers', v_interview.answers,
        'collaborator_name', v_collaborator.name,
        'collaborator_position', v_role.name,
        'collaborator_area', v_collaborator.area,
        'collaborator_termination_date', v_collaborator.termination_date,
        'template_schema', v_template.schema,
        'template_name', v_template.name
    );

    RETURN v_result;
END;
$$;
