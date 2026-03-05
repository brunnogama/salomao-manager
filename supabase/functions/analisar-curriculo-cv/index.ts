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
    const { candidatoId } = await req.json();
    if (!candidatoId) {
      throw new Error("Missing candidatoId parameter");
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

    // 1. Buscar dados basicos do candidato para orientar a IA se necessário
    const { data: candidato, error: candError } = await supabase
      .from('candidatos')
      .select('*')
      .eq('id', candidatoId)
      .single();

    if (candError || !candidato) throw new Error("Candidato não encontrado");

    // 2. Buscar Arquivos GED (Categoria = Currículo)
    const { data: geds, error: gedError } = await supabase
      .from('candidato_ged')
      .select('url, nome_arquivo')
      .eq('candidato_id', candidatoId)
      .eq('categoria', 'Currículo');

    if (gedError || !geds || geds.length === 0) {
      throw new Error("O candidato não possui um arquivo classificado como 'Currículo' no GED.");
    }

    // Pegar o último/mais recente cv
    const cv = geds[geds.length - 1];

    // 3. Fazer download do Arquivo 
    // CV URL is a full public URL from Supabase storage, fetch it to pass buffer to Gemini
    const fileRes = await fetch(cv.url);
    const pdfBlob = await fileRes.blob();

    // Converter blob para Uint8Array
    const buffer = await pdfBlob.arrayBuffer();
    // Converter array buffer para base64 para uso via GenAI APIREST Direct usando standard memory-safe encodeBase64
    const base64Data = encodeBase64(new Uint8Array(buffer));

    // 4. Prompt para a IA
    const systemInstruction = `Você é um Assistente de RH altamente especializado em Recrutamento e Seleção ATS (Applicant Tracking System).
Seu objetivo é extrair informações cruciais de currículos em formato PDF.
Por favor, analise o currículo anexo e retorne EXATAMENTE UM JSON válido seguindo a estrutura abaixo, sem marcações markdown extra ou blocos \`\`\`json:

{
  "resumoProfissional": "Resumo em 1 ou no máximo 2 parágrafos potentes relatando o quem é o profissional, histórico, qualificações e seniority.",
  "perfilTags": ["Habilidade 1", "Habilidade 2", "Tecnologia", "Ferramenta", "Soft Skill 1"],
  "sugestaoCargo": "Um nome curto de um cargo focado na experiência detectada."
}

Concentre-se em extrair no mínimo 5 e no máximo 15 tags reais relativas à experiência para compor "perfilTags".`;

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

    // 5. Chamar a Gemini REST API diretamente (Usando Gemini 1.5 Flash - rápido, barato e processa Docs/PDF nativamente)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const geminiData = await response.json();

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${geminiData.error?.message || 'Unknown'}`);
    }

    const rawText = geminiData.candidates[0].content.parts[0].text;

    // 6. Limpeza caso ainda devolva markdown "```json\n...\n```" (Fallback)
    let parsedData;
    try {
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanedText);
    } catch (e) {
      throw new Error("Falha ao fazer parse do resultado do Gemini: " + rawText);
    }

    return new Response(JSON.stringify({
      success: true,
      data: parsedData,
      cvProcessado: cv.nome_arquivo
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
