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

        const soapUrl = 'https://www5.oab.org.br/cnaws/service.asmx'
        let soapAction = 'http://tempuri.org/ConsultaAdvogadoPorCpf'
        let soapBody = ''

        if (cpf) {
            const cleanCpf = cpf.replace(/\D/g, '')
            soapAction = 'http://tempuri.org/ConsultaAdvogadoPorCpf'
            soapBody = `
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <ConsultaAdvogadoPorCpf xmlns="http://tempuri.org/">
              <cpf>${cleanCpf}</cpf>
            </ConsultaAdvogadoPorCpf>
          </soap:Body>
        </soap:Envelope>
      `
        } else if (nome) {
            // API documentation says ConsultaAdvogado needs nome, cpf, and uf. Let's check how many params are needed.
            // Usually nome is enough, or nome+uf. Let's try with just nome. If it requires UF we have to rethink.
            // Wait, we can just use ConsultaAdvogado by name. But let's build the request carefully.
            soapAction = 'http://tempuri.org/ConsultaAdvogado'
            soapBody = `
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <ConsultaAdvogado xmlns="http://tempuri.org/">
              <cpf></cpf>
              <nome>${nome}</nome>
              <uf></uf>
              <tipoInscricao></tipoInscricao>
            </ConsultaAdvogado>
          </soap:Body>
        </soap:Envelope>
      `
        }

        console.log('Enviando requisição SOAP:', soapAction)

        const response = await fetch(soapUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': soapAction,
            },
            body: soapBody,
        })

        const xmlText = await response.text()
        console.log('Resposta SOAP (status):', response.status)

        // Parse XML manually since we don't have a library
        const dataMatch = Array.from(xmlText.matchAll(/<DadosAdvogado>(.*?)<\/DadosAdvogado>/gs))

        const advogados = dataMatch.map(match => {
            const advogadoXml = match[1]

            const extractField = (field: string) => {
                const regex = new RegExp(`<${field}>(.*?)<\\/${field}>`, 's')
                const m = advogadoXml.match(regex)
                return m ? m[1].trim() : ''
            }

            const nomeCompleto = extractField('Nome')
            const situacao = extractField('Situacao')

            const inscricoesMatch = Array.from(advogadoXml.matchAll(/<Inscricao>(.*?)<\/Inscricao>/gs))
            const inscricoes = inscricoesMatch.map(inscMatch => {
                const inscXml = inscMatch[1]
                const extractInscField = (field: string) => {
                    const regex = new RegExp(`<${field}>(.*?)<\\/${field}>`, 's')
                    const m = inscXml.match(regex)
                    return m ? m[1].trim() : ''
                }
                return {
                    numero: extractInscField('Numero'),
                    numeroInscricao: extractInscField('NumeroInscricao'),
                    uf: extractInscField('Secional'),
                    tipo: extractInscField('TipoInscricao'),
                    situacao: extractInscField('Situacao')
                }
            })

            return {
                nome: nomeCompleto,
                situacao,
                inscricoes
            }
        })

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
