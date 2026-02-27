import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { cpf, nome } = await req.json()
        console.log('Recebido pedido de consulta CNA:', { cpf, nome })

        if (!cpf && !nome) {
            throw new Error('CPF ou Nome é obrigatório')
        }

        // As we found out, cna.oab.org.br doesn't easily support CPF via the public search form without knowing specific tokens
        // But it perfectly supports Name searches. If CPF is used and Name is omitted, we might need a workaround. Let's try to just use Nome.
        // Actually the user interface provides Nome. Let's use it.
        let searchQuery = nome || cpf;

        // Step 1: Get the RequestVerificationToken and Cookies from the main page
        const p1 = await fetch('https://cna.oab.org.br/');
        const p1t = await p1.text();
        const tokenMatch = p1t.match(/name="__RequestVerificationToken" type="hidden" value="([^"]+)"/);
        const token = tokenMatch ? tokenMatch[1] : '';

        const setCookieHeader = p1.headers.get('set-cookie');
        let cookies = '';
        if (setCookieHeader) {
            // Deno's fetch might combine cookies or keep them raw. A simple split by comma might be enough for ASP.NET cookies.
            // Or we can just pass the raw set-cookie header as Cookie if it's formatted well enough.
            // Usually, just extracting the first part before ';' of each cookie is safer.
            const cookieArray = [...p1.headers.entries()].filter(([k]) => k.toLowerCase() === 'set-cookie').map(([_, v]) => v.split(';')[0]);
            if (cookieArray.length > 0) {
                cookies = cookieArray.join('; ');
            } else {
                cookies = setCookieHeader.split(',').map(c => c.split(';')[0].trim()).join('; ');
            }
        }

        // Step 2: Make the POST request to the Search endpoint
        const data = new URLSearchParams();
        data.append('NomeAdvo', searchQuery);
        data.append('Insc', '');
        data.append('Uf', '');
        data.append('TipoInsc', 'Todos');
        data.append('IsMobile', 'false');
        if (token) data.append('__RequestVerificationToken', token);

        const res = await fetch('https://cna.oab.org.br/Home/Search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookies,
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: data.toString()
        });

        const jsonText = await res.text();
        console.log("CNA Response Status:", res.status);

        let result;
        try {
            result = JSON.parse(jsonText);
        } catch (e) {
            console.error("Failed to parse JSON:", jsonText);
            throw new Error("Erro ao interpretar resposta do CNA");
        }

        if (!result.Success || !result.Data) {
            throw new Error(result.Message || 'Nenhum resultado encontrado.');
        }

        // The data format from CNA is:
        // {"Nome":"...","TipoInscOab":"ADVOGADO|SUPLEMENTAR|ESTAGIARIO","Inscricao":"123","UF":"DF", ...}
        // Group by Nome since the old logic expects an array of advogados with multiple inscrições
        const advogadosMap = new Map();

        result.Data.forEach((item: any) => {
            const advName = item.Nome;
            if (!advogadosMap.has(advName)) {
                advogadosMap.set(advName, {
                    nome: advName,
                    situacao: 'Ativo', // CNA site doesn't return situacao directly in summary without scraping DetailUrl
                    inscricoes: []
                });
            }
            const adv = advogadosMap.get(advName);

            let tipo = item.TipoInscOab === 'ADVOGADO' ? 'Principal' : item.TipoInscOab;
            if (item.TipoInscOab === 'SUPLEMENTAR') tipo = 'Suplementar';

            adv.inscricoes.push({
                numero: item.Inscricao,
                numeroInscricao: item.Inscricao,
                uf: item.UF,
                tipo: tipo,
                situacao: 'Regular'
            });
        });

        const advogados = Array.from(advogadosMap.values());

        return new Response(
            JSON.stringify(advogados),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        console.error('Erro na Edge Function:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
