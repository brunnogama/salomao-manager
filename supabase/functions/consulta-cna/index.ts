import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // 1. Trata o Preflight (O navegador pergunta se pode acessar)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, // IMPORTANTE: Precisa ser 200
      headers: corsHeaders 
    })
  }

  try {
    const { numero, uf } = await req.json()

    if (!numero || !uf) {
      throw new Error("Número da OAB e UF são obrigatórios.")
    }

    const url = `https://cna.oab.org.br/Home/Search?SearchOabNumber=${numero}&SearchOabState=${uf}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    })

    const html = await response.text()
    const sociedades: string[] = []
    const regexSociedade = /Sociedade de Advogados:<\/strong>\s*([^<]+)/gi
    
    let match
    while ((match = regexSociedade.exec(html)) !== null) {
      if (match[1]) sociedades.push(match[1].trim())
    }

    return new Response(
      JSON.stringify({ 
        sociedades: [...new Set(sociedades)],
        success: true 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 200, // Retornamos 200 mesmo no erro para o CORS não bloquear a leitura da mensagem
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})