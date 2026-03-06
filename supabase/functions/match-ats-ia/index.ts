import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Configurando opções CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { candidatoId, vagaId } = await req.json();

    if (!candidatoId || !vagaId) {
      throw new Error("Missing candidatoId or vagaId parameters");
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error("A chave GEMINI_API_KEY não está configurada nos Secrets da Edge Function.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    console.log(`🧠 Iniciando IA Match para Candidato ID: ${candidatoId} vs Vaga ID: ${vagaId}`);

    // 1. Buscar dados do Candidato
    const { data: candidato, error: candError } = await supabase
      .from('candidatos')
      .select('nome, role, area, perfil, resumo_cv, atividades_academicas, experiencias_raw:candidato_experiencias(empresa, cargo, descricao)')
      .eq('id', candidatoId)
      .single();

    if (candError || !candidato) throw new Error(`Candidato não encontrado. Erro: ${candError?.message}`);

    // 2. Buscar dados da Vaga e Role relacionado
    const { data: vaga, error: vagaError } = await supabase
      .from('vagas')
      .select('vaga_id_text, descricao, requisitos, qualificacoes, role:roles(name)')
      .eq('id', vagaId)
      .single();

    if (vagaError || !vaga) throw new Error(`Vaga não encontrada. Erro: ${vagaError?.message}`);

    // 3. Montar prompt otimizado para a Gemini analisar aderência
    const roleVaga = vaga.role ? (vaga.role as any).name : 'Cargo não especificado';

    // Tratativa para os dados não ficarem enormes:
    const candidatoProfile = `
Nome: ${candidato.nome}
Cargo/Área: ${candidato.role || 'Não preenchido'} / ${candidato.area || 'Não preenchida'}
Resumo: ${candidato.resumo_cv || 'Sem resumo'}
Tags (Skills): ${candidato.perfil?.replace(/\n/g, ', ') || 'Nenhuma tag'}

Experiências Profissionais:
${(candidato.experiencias_raw as any[])?.slice(0, 3).map((e: any) => `- ${e.cargo} na ${e.empresa}\n  Descricao: ${e.descricao}`).join('\n\n') || '- Nenhuma experiência cadastrada ou detalhada'}
`.trim().substring(0, 3000); // Corte de safety preventivo para API

    const vagaProfile = `
Código/Cargo da Vaga: ${vaga.vaga_id_text} - ${roleVaga}
Requisitos / Qualificações Base:
${vaga.requisitos || 'Sem requistos especificados'}
${vaga.qualificacoes || ''}
${vaga.descricao || ''}
`.trim().substring(0, 3000); // Corte de safety preventivo para API

    const systemInstruction = `Você é o sistema "Match Inteligente", um analisador ATS avançado de Recursos Humanos.
O seu objetivo é comparar os dados de um Candidato com os perfis de uma Vaga Alvo, calculando um índice de aderência real e extraindo os pontos positivos e deficiências em um JSON rigorosamente estruturado.

Por favor, seja MUITO criterioso no \`score\`. Pontuações artificiais frustram recrutadores. Se a vaga pedir advogado júnior mas o cara for sênior de TI, a nota deve ser absurdamente baixa.

Retorne SOMENTE UM JSON válido, com a estrutura:
{
  "score": NUMERO INTEIRO (0 a 100),
  "matchesTags": ["Lista", "De", "Tags", "em comum/que o talento resolve na vaga", "Máx 5"],
  "gaps": ["Lista", "De", "Gaps ou", "Diferentes de perfis", "Máx 3 (deixe vazio [] se 100% de match)"],
  "justificativa": "Um texto curto em terceira pessoa ('O talento possui...', 'Sua experiência demonstra...'), com no MÁXIMO 2 frases fortes (30-40 palavras) sobre do porquê esse match funciona ou porquê não. Seja direto, como um conselho de recrutador expert de 5 segundos."
}`;

    const promptText = `== CANDIDATO ==\n${candidatoProfile}\n\n== VAGA ==\n${vagaProfile}`;

    const requestBody = {
      contents: [{
        parts: [
          { text: systemInstruction },
          { text: promptText }
        ]
      }],
      generationConfig: {
        temperature: 0.1, // temperatura muito baixa p/ garantir consistência matemática e de formatação do json
        responseMimeType: "application/json",
      }
    };

    // 4. Chamada via API REST Gemini 2.5 Flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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

    let rawText = "";

    if (geminiData.candidates && geminiData.candidates.length > 0) {
      const candidate = geminiData.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        rawText = candidate.content.parts[0].text;
      }
    }

    if (!rawText) {
      throw new Error("Resposta vazia da IA Gemini. \n" + JSON.stringify(geminiData));
    }

    // 5. Parse Safely
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
      throw new Error(`A IA não retornou um JSON válido. Erro do parse: ${jsonErrorMsg}`);
    }

    return new Response(JSON.stringify({
      success: true,
      data: parsedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("❌ ERRO NA EDGE FUNCTION MATCH:", error.stack || error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
