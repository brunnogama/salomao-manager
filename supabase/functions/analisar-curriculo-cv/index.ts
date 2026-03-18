import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// You must use npm:pdf-parse in Deno since we need to extract from PDF
import { extractText, getDocumentProxy } from 'https://esm.sh/unpdf@0.10.0'

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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error("A chave OPENAI_API_KEY não está configurada nos Secrets da Edge Function.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    console.log(`📝 Iniciando processamento para ID: ${candidatoId || 'TEMP'} | Contexto: ${context}`);

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
        throw new Error(`O ${isColaborador ? 'colaborador' : 'candidato'} não possui um arquivo classificado como 'Currículo'.`);
      }

      // Pegar o último/mais recente cv
      const cv = geds[geds.length - 1];
      if (!cv.url) throw new Error("O registro de currículo não contém uma URL válida.");

      console.log("📂 Encontrado Currículo:", cv.nome_arquivo);
      cvNomeArquivo = cv.nome_arquivo;

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

    // Converter blob para buffer e extrair texto via unpdf (Deno native)
    console.log("📄 Lendo o PDF e extraindo texto...");
    const arrayBuffer = await fileData.arrayBuffer();
    
    let cvText = "";
    try {
        const result = await extractText(arrayBuffer);
        
        // Dependendo da versão, extractText pode retornar uma string diretamente ou um objeto { text: string }
        if (typeof result === "string") {
            cvText = result;
        } else if (result && typeof result === "object" && 'text' in result) {
            
            // @ts-ignore
            if (Array.isArray(result.text)) {
                // @ts-ignore
                cvText = result.text.join('\n');
            } else {
                // @ts-ignore
                cvText = result.text;
            }
            
        } else {
            cvText = String(result);
        }
    } catch (err: any) {
        console.error("Erro no unpdf extraindo texto:", err.message);
        throw new Error("Falha ao ler o conteúdo do PDF. O arquivo pode estar corrompido ou protegido.");
    }
    
    if (typeof cvText !== 'string' || !cvText || cvText.trim().length === 0) {
       throw new Error("O PDF baixado não contém texto selecionável (pode ser uma imagem escaneada).");
    }
    
    console.log("✅ PDF convertido para texto com sucesso. Tamanho:", cvText.length);

    // 4. Prompt para a IA
    const systemInstruction = `Você é um Assistente de RH altamente especializado em Recrutamento e Seleção ATS (Applicant Tracking System).
Seu objetivo é extrair o MÁXIMO de informações cruciais de currículos (enviados como texto bruto extraído de PDF) para pré-preencher um cadastro completo.
Por favor, analise o currículo e retorne EXATAMENTE UM JSON válido seguindo a estrutura abaixo:

{
  "nome": "Nome completo real",
  "email": "Email de contato (IMPRESCINDÍVEL. Você DEVE extrair qualquer string que contenha o caractere '@' no documento)",
  "telefone": "Telefone/Celular (OBRIGATÓRIO BUSCAR. Pode estar formatado de diversas maneiras)",
  "genero": "Somente preencha com 'Masculino', 'Feminino' ou 'Outro'. Use o nome do candidato e pronomes para deduzir.",
  "data_nascimento": "YYYY-MM-DD",
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
  "perfilTags": ["Habilidade 1", "Habilidade 2", "Tecnologia", "Soft Skill 1"],
  "education_history": [
    {
      "instituicao": "Nome curto da Instituição de Ensino",
      "curso": "Nome do Curso",
      "nivel": "Ensino Fundamental, Ensino Médio, Graduação, Pós-Graduação",
      "status": "Cursando, Formado(a), Trancado",
      "ano_conclusao": "Ano de conclusão (Ex: 2024)"
    }
  ],
  "atividades_academicas": "Extraia outras informações esparsas sobre atividades acadêmicas relevantes, qualificações, cursos livres, monitorias, extensões universitárias, etc. Importante: Formate como uma lista separada EXCLUSIVAMENTE por uma quebra de linha ('\\n') se houver mais de uma.",
  "idiomas": "Extraia SOMENTE o Idioma e o Nível. Exemplo: 'Inglês Fluente\\nEspanhol Intermediário'. Formate separados por quebra de linha ('\\n').",
  "experiencias": [
    {
       "empresa": "Nome da empresa onde trabalhou",
       "cargo": "Cargo ocupado",
       "inicio": "YYYY-MM-DD",
       "fim": "YYYY-MM-DD",
       "descricao": "Resumo das responsabilidades"
    }
  ],
  "linkedin": "URL do linkedin caso encontre"
}

Retorne null para propriedades que não achar.`;

    const requestBody = {
      model: "gpt-5.4-nano",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: "Aqui está o conteúdo extraído do currículo em formato de texto. Extraia os dados e devolva seguindo estritamente a estrutura JSON especificada:\n\n" + cvText }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    };

    // 5. Chamar a OpenAI REST API diretamente
    const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    const openaiData = await response.json();

    if (!response.ok) {
      console.error("OPENAI API ERROR PAYLOAD:", openaiData);
      throw new Error(`OpenAI API Error: ${openaiData.error?.message || 'Unknown'}`);
    }

    let rawText = "";

    if (openaiData.choices && openaiData.choices.length > 0) {
      rawText = openaiData.choices[0].message.content;
    }

    if (!rawText) {
      throw new Error("Resposta vazia da IA OpenAI. " + JSON.stringify(openaiData));
    }

    let parsedData;
    let jsonErrorMsg = "";
    try {
      parsedData = JSON.parse(rawText);
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
