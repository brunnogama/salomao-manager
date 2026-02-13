// supabase/functions/enviar-email-fatura/index.ts
// Edge Function para envio de e-mails via Resend, SendGrid, ou outro serviço

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface EmailPayload {
  destinatario: string
  remetente: string
  assunto: string
  corpo: string
  arquivos_urls?: string[]
  fatura_id: string
}

serve(async (req) => {
  try {
    const payload: EmailPayload = await req.json()

    // Enviar e-mail via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Salomão Manager <financeiro@salomao.com>', // Idealmente usar um domínio verificado. Se payload.remetente for aceito, ótimo, senão fixar um no-reply
        to: [payload.destinatario],
        bcc: [payload.remetente], // Cópia oculta para o remetente (usuário)
        reply_to: payload.remetente, // Responder para o remetente original
        subject: payload.assunto,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #112240 100%); padding: 30px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Salomão Advogados</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">Fatura de Honorários</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              ${payload.corpo ? `<p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">${payload.corpo.replace(/\n/g, '<br>')}</p>` : ''}
              
              ${payload.arquivos_urls && payload.arquivos_urls.length > 0 ? `
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-top: 20px;">
                  <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 16px;">📎 Documentos Anexados:</h3>
                  ${payload.arquivos_urls.map(url => `
                    <a href="${url}" style="display: block; color: #1e3a8a; text-decoration: none; padding: 10px; background: white; border-radius: 6px; margin-bottom: 10px;">
                      📄 Baixar arquivo
                    </a>
                  `).join('')}
                </div>
              ` : ''}
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  Este é um e-mail automático do sistema de gestão financeira Salomão Manager.
                </p>
              </div>
            </div>
          </div>
        `
      })
    })

    if (!emailResponse.ok) {
      throw new Error('Falha ao enviar e-mail via Resend')
    }

    // Registrar log de envio no Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    await supabase
      .from('finance_faturas')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.fatura_id)

    return new Response(
      JSON.stringify({ success: true, message: 'E-mail enviado com sucesso' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
