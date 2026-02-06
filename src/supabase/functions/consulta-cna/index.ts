import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { numero, uf } = await req.json()

    // O CNA exige alguns parâmetros específicos. Esta URL simula a busca direta.
    const url = `https://cna.oab.org.br/Home/Search?SearchOabNumber=${numero}&SearchOabState=${uf}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      }
    })

    const html = await response.text()

    // Lógica simplificada de extração (Scraping)
    // Procuramos por padrões de nomes de sociedades dentro do HTML retornado
    const sociedades: string[] = []
    
    // O CNA lista sociedades em tabelas ou divs específicas. 
    // Aqui buscamos por termos comuns em nomes de escritórios de advocacia
    const regexSociedade = /Sociedade de Advogados:<\/strong>\s*([^<]+)/gi
    let match
    while ((match = regexSociedade.exec(html)) !== null) {
      if (match[1]) sociedades.push(match[1].trim())
    }

    return new Response(
      JSON.stringify({ 
        sociedades: [...new Set(sociedades)], // Remove duplicatas
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
