import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Tratando opções do CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { candidatoId, context = 'candidato', tempObjectPath } = await req.json();
    if (!candidatoId && !tempObjectPath) {
      throw new Error("Missing candidatoId parameter or tempObjectPath");
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error("A chave GEMINI_API_KEY não está configurada nos Secrets do Supabase.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    console.log(`📝 Iniciando processamento para ID: ${candidatoId || 'TEMP'} | Contexto: ${context} | tempObjectPath: ${tempObjectPath}`);

    let objectPath = tempObjectPath;
    let cvNomeArquivo = tempObjectPath ? tempObjectPath.split('/').pop() : 'Curriculo.pdf';

    if (!tempObjectPath) {
      const isColaborador = context === 'colaborador';
      const mainTable = isColaborador ? 'collaborators' : 'candidatos';
      const gedTable = isColaborador ? 'ged_colaboradores' : 'candidato_ged';
      const gedJoinColumn = isColaborador ? 'colaborador_id' : 'candidato_id';

      const { data: entityData, error: entityError } = await supabase
        .from(mainTable)
        .select('*')
        .eq('id', candidatoId)
        .single();

      if (entityError || !entityData) throw new Error(`${isColaborador ? 'Colaborador' : 'Candidato'} não encontrado. Erro: ${entityError?.message}`);

      // 2. Buscar Arquivos GED (categoria = Currículo)
      const { data: geds, error: gedError } = await supabase
        .from(gedTable)
        .select('url, nome_arquivo')
        .eq(gedJoinColumn, candidatoId)
        .eq('categoria', 'Currículo');

      if (gedError || !geds || geds.length === 0) {
        throw new Error(`O ${isColaborador ? 'colaborador' : 'candidato'} não possui um arquivo classificado como 'Currículo' no banco de dados GED.`);
      }

      // Pegar o último/mais recente cv
      const cv = geds[geds.length - 1];
      if (!cv.url) throw new Error("O registro de currículo não contém uma URL válida.");

      console.log("📂 Encontrado Currículo:", cv.nome_arquivo);
      cvNomeArquivo = cv.nome_arquivo;

      // 3. Fazer download do Arquivo do Storage
      // Extraindo o caminho do storage da public URL: '.../storage/v1/object/public/ged-colaboradores/candidatos/ID/ged/blabla.pdf'
      // Como a URL vem do Supabase Storage public, garantimos o download via SDK para bypass CORS/Auth limitations.
      const file_path_matches = cv.url.match(/ged-colaboradores\/(.+)$/);
      objectPath = file_path_matches ? file_path_matches[1] : null;

      if (!objectPath) throw new Error("Não foi possível extrair o caminho do bucket pela URL fornecida: " + cv.url);
    }

    console.log("📥 Baixando arquivo do Bucket no caminho:", objectPath);
    const { data: fileData, error: downloadError } = await supabase.storage.from('ged-colaboradores').download(objectPath);

    if (downloadError) {
      console.error("ERRO DOWNLOAD:", downloadError.message);
      throw new Error("Erro ao baixar PDF do bucket interno: " + downloadError.message);
    }

    // Converter blob para Uint8Array
    const buffer = await fileData.arrayBuffer();
    const base64Data = encodeBase64(new Uint8Array(buffer));
    console.log("✅ PDF convertido para Base64 com sucesso. Tamanho:", base64Data.length);

    // 4. Prompt para a IA
    const systemInstruction = `Você é um Assistente de RH altamente especializado em Recrutamento e Seleção ATS (Applicant Tracking System).
Seu objetivo é extrair o MÁXIMO de informações cruciais de currículos em formato PDF para pré-preencher um cadastro completo.
Por favor, analise o currículo anexo e retorne EXATAMENTE UM JSON válido seguindo a estrutura abaixo, sem marcações markdown extra ou blocos \`\`\`json:

{
  "nome": "Nome completo real",
  "email": "Email de contato (IMPRESCINDÍVEL. Você DEVE extrair qualquer string que contenha o caractere '@' no documento, seja no cabeçalho, no texto, ou isolado. Procure ativamente pelos domínios mais comuns como @gmail.com, @hotmail.com e @outlook.com. Exemplo: brunnogama@gmail.com. Não deixe isso em branco sob nenhuma hipótese se houver um email no PDF!)",
  "telefone": "Telefone/Celular (OBRIGATÓRIO BUSCAR. Pode estar formatado de diversas maneiras normais ou mascaradas, como '(**) *****-****', '** *****.***', '(**) *********', com espaços, traços ou pontos. Extraia o valor exatamente como encontrar no documento. Procure no cabeçalho ou seções de contato.)",
  "genero": "Somente preencha com 'Masculino', 'Feminino' ou 'Outro'. Use o nome do candidato e os pronomes no currículo para deduzir o gênero.",
  "data_nascimento": "YYYY-MM-DD (Seje inteligente na busca. Exemplos: 'Nascimento: 08/04/2004' -> '2004-04-08', 'Data de Nascimento: 10 de maio de 1990' -> '1990-05-10'. Se não houver, retorne null)",
  "endereco": {
    "cep": "CEP se houver",
    "logradouro": "Apenas o nome da Rua/Avenida, sem o número",
    "numero": "Apenas o número do endereço",
    "complemento": "Apenas o complemento (apto, bloco, casa, etc) se houver",
    "bairro": "Bairro",
    "cidade": "Cidade",
    "estado": "Sigla do Estado (Ex: RJ, SP)"
  },
  "resumoProfissional": "Resumo em 1 ou no máximo 2 parágrafos potentes relatando o quem é o profissional, histórico, qualificações e seniority.",
  "sugestaoCargo": "Um nome curto de um cargo focado na experiência detectada.",
  "perfilTags": ["Habilidade 1", "Habilidade 2", "Tecnologia", "Ferramenta", "Soft Skill 1"],
  "education_history": [
    {
      "instituicao": "Nome curto da Instituição de Ensino (Ex: UFRJ, Estácio, IBMEC)",
      "curso": "Nome do Curso (Ex: Direito, Administração, Ciência da Computação)",
      "nivel": "Deve ser estritamente um destes: Ensino Fundamental, Ensino Médio, Graduação, Pós-Graduação",
      "status": "Deve ser estritamente um destes: Cursando, Formado(a), Trancado",
      "ano_conclusao": "Ano de conclusão (Ex: 2024). Se estiver Cursando, colocar a previsão de conclusão"
    }
  ],
  "atividades_academicas": "Extraia outras informações esparsas sobre atividades acadêmicas relevantes, qualificações, cursos livres, monitorias, extensões universitárias, etc. Se não houver, null. Importante: Formate como uma lista separada EXCLUSIVAMENTE por uma quebra de linha ('\\n') se houver mais de uma.",
  "idiomas": "Extraia SOMENTE o Idioma e o Nível, omitindo explicações extensas sobre certificados. Exemplo: 'Inglês Fluente\\nEspanhol Intermediário'. Formate como uma lista separada EXCLUSIVAMENTE por uma quebra de linha ('\\n') se houver mais de um. NENHUMA vírgula. Se não houver, null.",
  "experiencias": [
    {
       "empresa": "Nome da empresa onde trabalhou",
       "cargo": "Cargo ocupado",
       "inicio": "YYYY-MM-DD (Se houver apenas mês e ano, adote o dia 01. Ex: 'outubro de 2023' -> '2023-10-01'. Se for N/A use null)",
       "fim": "YYYY-MM-DD (Mesma regra acima. Se for atual ou N/A, use null)",
       "descricao": "Resumo das responsabilidades"
    }
  ],
  "linkedin": "URL do linkedin caso encontre (Procure no cabeçalho, como linkedin.com/in/usuario)"
}

Para as listagens de 'experiencias' preencha o máximo que o currículo permitir.
Para 'perfilTags', concentre-se em extrair no mínimo 5 e no máximo 15 tags reais relativas à experiência técnica e soft skills.
ATENÇÃO REDOBRADA: A maioria dos currículos possui email e telefone no topo (cabeçalho) ou na lateral. Não deixe de extrair esses dados de contato.
Retorne null para propriedades do tipo primitivo que não achar (como string ou número).`;

    const requestBody = {
      contents: [{
        parts: [
          { text: systemInstruction },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      }
    };

    // 5. Chamar a Gemini REST API diretamente (Usando Gemini 1.5 Flash - rápido, barato e 1500 req/dia gratis)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const geminiData = await response.json();

    if (!response.ok) {
      console.error("GEMINI API ERROR PAYLOAD:", geminiData);
      throw new Error(`Gemini API Error: ${geminiData.error?.message || 'Unknown'}`);
    }

    let rawText = "";

    if (geminiData.candidates && geminiData.candidates.length > 0) {
      const candidate = geminiData.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        rawText = candidate.content.parts[0].text;
      } else if (candidate.finishReason) {
        throw new Error(`Gemini não retornou conteúdo. Motivo: ${candidate.finishReason}`);
      }
    } else if (geminiData.promptFeedback) {
      throw new Error(`Prompt bloqueado por filtros de segurança: ${JSON.stringify(geminiData.promptFeedback)}`);
    }

    if (!rawText) {
      throw new Error("Resposta vazia da IA Gemini. " + JSON.stringify(geminiData));
    }

    // 6. Limpeza caso ainda devolva markdown "```json\n...\n```" (Fallback)
    let parsedData;
    let jsonErrorMsg = "";
    try {
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanedText);
    } catch (e: any) {
      console.error("JSON PARSE ERROR:", e.message);
      console.error("RAW TEXT:", rawText);
      jsonErrorMsg = e.message;
    }

    if (!parsedData) {
      throw new Error(`A IA não retornou um JSON válido. Erro do parse: ${jsonErrorMsg}. Texto puro retornado: ${rawText.substring(0, 500)}...`);
    }

    // Fix uppercase names (Camel Case / Title Case)
    if (parsedData.nome && typeof parsedData.nome === 'string') {
      if (parsedData.nome === parsedData.nome.toUpperCase()) {
        parsedData.nome = parsedData.nome.replace(
          /\w\S*/g,
          (txt: string) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
        );
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: parsedData,
      cvProcessado: cvNomeArquivo
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("❌ ERRO FATAL NA EDGE FUNCTION:", undefined, error.stack || error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
