// supabase/functions/consulta-cna/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Sem autorização')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Usuário não autenticado')
    }

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
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})