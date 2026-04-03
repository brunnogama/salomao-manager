import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { processNumber, contractProcessId } = await req.json();

    if (!processNumber) {
      throw new Error("Missing processNumber parameter");
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error("A chave OPENAI_API_KEY não está configurada nos Secrets.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    // 1. Limpar número do processo (apenas dígitos)
    const cleanNumber = processNumber.replace(/\D/g, '');
    
    console.log(`🔍 Buscando processo ${cleanNumber} no DataJud CNJ...`);

    // 2. Chamar a API Pública do Datajud (CNJ)
    // A chave pública oficial atualizada pelo CNJ:
    const datajudApiKey = Deno.env.get('DATAJUD_API_KEY') || "";
    
    // Rota que busca em todos os tribunais (_search global api_publica_)
    const cnjResponse = await fetch(`https://api-publica.datajud.cnj.jus.br/api_publica_*/_search`, {
      method: "POST",
      headers: {
        "Authorization": `APIKey ${datajudApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "query": {
          "match": {
            "numeroProcesso": cleanNumber
          }
        }
      })
    });

    if (!cnjResponse.ok) {
      console.error("Erro na API do CNJ:", cnjResponse.statusText);
      throw new Error(`Erro ao consultar CNJ: ${cnjResponse.statusText}`);
    }

    const cnjData = await cnjResponse.json();
    
    const hits = cnjData.hits?.hits;
    if (!hits || hits.length === 0) {
      throw new Error(`Processo ${processNumber} não encontrado nas bases públicas do DataJud CNJ.`);
    }

    // Pegamos a primeira ocorrência
    const processInstance = hits[0]._source;
    const movimentosRaw = processInstance.movimentos || [];

    if (movimentosRaw.length === 0) {
      throw new Error(`O processo ${processNumber} foi encontrado no CNJ, mas não tem andamentos públicos para resumir.`);
    }

    // 3. Organizar os movimentos por data
    const sortedMovimentos = movimentosRaw.sort((a: any, b: any) => {
      return new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime();
    });

    // Construir um texto gigante com os andamentos para enviar pra IA
    let textAndamentos = `Tribunal: ${processInstance.siglaTribunal || 'Não informado'}\n`;
    textAndamentos += `Classe: ${processInstance.classe?.nome || 'Não informada'}\n`;
    textAndamentos += `Assunto: ${processInstance.assunto?.[0]?.nome || 'Não informado'}\n\n=== ANDAMENTOS ===\n`;

    sortedMovimentos.forEach((mov: any) => {
      const dataStr = new Date(mov.dataHora).toLocaleDateString('pt-BR');
      textAndamentos += `[${dataStr}] ${mov.nome}\n`;
      if (mov.complementosTabelados && mov.complementosTabelados.length > 0) {
         mov.complementosTabelados.forEach((comp: any) => {
           if (comp.valor) textAndamentos += `  - Detalhe: ${comp.valor}\n`;
         });
      }
    });

    console.log(`📄 Resumindo ${sortedMovimentos.length} movimentos via OpenAI...`);

    // 4. Chamar a OpenAI
    const systemInstruction = `Você é um Assistente Jurídico Especialista.
Sua missão é receber os dados de um processo (Classe, Assunto e andamentos) obtidos via Tribunal (CNJ/Datajud) e gerar **somente um breve parágrafo** resumindo objetivamente qual é o Objeto da Ação (ou seja, do que se trata o processo e qual o pedido principal).

**Regras estritas:**
1. Retorne APENAS um único parágrafo descrevendo o objeto/assunto da ação de forma clara e direta.
2. NÃO inclua status da ação (como "Status: Trânsito em Julgado").
3. NÃO inclua linha do tempo, histórico cronológico ou histórico de movimentações.
4. NÃO inclua marcadores de lista, datas ou andamentos processuais.
5. Vá direto ao ponto, sem juridiquês antiquado.
Exemplo de saída esperada: "A ação refere-se ao Cumprimento de Sentença de Ações Coletivas, onde se busca a efetivação de uma decisão judicial que beneficia um grupo de pessoas em relação a um determinado direito."`;

    const requestBody = {
      model: "gpt-4o-mini", // Utilizando um modelo rápido e da geração mais atual da OpenAI
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Aqui está o histórico de andamentos extraído do CNJ. Por favor, analise e crie o resumo executivo.\n\n${textAndamentos}` }
      ],
      temperature: 0.2
    };

    const openaiResponse = await fetch(`https://api.openai.com/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    const openaiData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API Error: ${openaiData.error?.message || 'Unknown'}`);
    }

    const iaSummaryText = openaiData.choices?.[0]?.message?.content;

    if (!iaSummaryText) {
      throw new Error("Resposta de resumo vazia gerada pela OpenAI.");
    }

    // 5. Salvar no banco (se um contractProcessId foi fornecido)
    if (contractProcessId) {
      console.log(`💾 Salvando o resumo no Supabase para o Processo ID: ${contractProcessId}...`);
      const { error: updateError } = await supabase
        .from('contract_processes')
        .update({
          ia_summary: iaSummaryText,
          ia_summary_date: new Date().toISOString()
        })
        .eq('id', contractProcessId);

      if (updateError) {
        console.error("Erro ao salvar resumo no banco:", updateError.message);
        // Não jogamos throw aqui pra não perder o texto gerado caso dê erro apenas de update,
        // mas em produção, monitoramos.
      }
    }

    return new Response(JSON.stringify({
      success: true,
      summary: iaSummaryText,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("❌ ERRO Edge Function resumir-processo-tj:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Retornando 200 para conseguirmos ler o erro real no Frontend
    })
  }
})
