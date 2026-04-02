import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface InviteEmailRequest {
  to: string
  makeup_artist_name: string
  invite_link: string
  invite_id: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const {
      to,
      makeup_artist_name,
      invite_link,
      invite_id,
    }: InviteEmailRequest = await req.json()

    if (!to || !makeup_artist_name || !invite_link || !invite_id) {
      throw new Error('Missing required fields')
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: #0a0a0a; 
              color: #ffffff; 
              line-height: 1.6;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 40px 20px; 
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              border-bottom: 1px solid #333;
              padding-bottom: 20px;
            }
            .logo { 
              font-size: 28px; 
              font-weight: 700; 
              color: #ffffff; 
              letter-spacing: 0.1em;
              text-transform: uppercase;
            }
            .subtitle {
              font-size: 11px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.2em;
              margin-top: 8px;
            }
            .content { 
              background: #1a1a1a; 
              border: 1px solid #333; 
              padding: 40px 30px; 
              border-radius: 0;
            }
            h1 {
              font-size: 24px;
              font-weight: 600;
              margin-bottom: 20px;
              color: #ffffff;
            }
            p { 
              color: #cccccc; 
              margin-bottom: 16px;
              font-size: 15px;
            }
            .highlight {
              color: #ffffff;
              font-weight: 600;
            }
            .button-container {
              text-align: center;
              margin: 32px 0;
            }
            .button { 
              display: inline-block; 
              padding: 16px 40px; 
              background: #ffffff; 
              color: #0a0a0a; 
              text-decoration: none; 
              font-weight: 600; 
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              transition: all 0.2s;
            }
            .button:hover {
              background: #f0f0f0;
            }
            .link-fallback {
              font-size: 12px;
              color: #666;
              word-break: break-all;
              background: #0a0a0a;
              padding: 12px;
              border: 1px solid #333;
              margin-top: 16px;
            }
            .link-fallback code {
              color: #999;
              font-family: 'Courier New', monospace;
            }
            .divider {
              border: 0;
              border-top: 1px solid #333;
              margin: 30px 0;
            }
            .upgrade-section {
              background: #0a0a0a;
              border: 1px solid #333;
              padding: 20px;
              margin-top: 20px;
            }
            .upgrade-section p {
              font-size: 13px;
              color: #999;
              margin-bottom: 8px;
            }
            .footer { 
              text-align: center; 
              margin-top: 40px; 
              padding-top: 20px;
              border-top: 1px solid #333;
            }
            .footer p {
              color: #666; 
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin-bottom: 8px;
            }
            @media only screen and (max-width: 600px) {
              .container { padding: 20px 16px; }
              .content { padding: 24px 20px; }
              h1 { font-size: 20px; }
              .button { padding: 14px 32px; font-size: 13px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">KHAOS KONTROL</div>
              <div class="subtitle">Industrial Management System</div>
            </div>
            
            <div class="content">
              <h1>Você foi convidada para ser Assistente!</h1>
              
              <p>Olá!</p>
              
              <p><span class="highlight">${makeup_artist_name}</span> te convidou para ser assistente dela na plataforma Khaos Kontrol.</p>
              
              <p>Como assistente, você terá acesso a:</p>
              <ul style="color: #cccccc; margin: 16px 0 16px 24px;">
                <li style="margin-bottom: 8px;">📅 Agenda de eventos e compromissos</li>
                <li style="margin-bottom: 8px;">👰 Informações dos clientes e serviços</li>
                <li style="margin-bottom: 8px;">🔔 Notificações de escalas e atualizações</li>
                <li style="margin-bottom: 8px;">📊 Acompanhamento de projetos</li>
              </ul>
              
              <div class="button-container">
                <a href="${invite_link}" class="button">Aceitar Convite</a>
              </div>
              
              <div class="link-fallback">
                <p style="margin-bottom: 8px;">Ou copie e cole este link no navegador:</p>
                <code>${invite_link}</code>
              </div>
              
              <hr class="divider">
              
              <div class="upgrade-section">
                <p><strong>💎 Quer ter sua própria conta completa?</strong></p>
                <p>Assistentes podem fazer upgrade para uma conta profissional e gerenciar seus próprios clientes, agenda e financeiro!</p>
              </div>
            </div>
            
            <div class="footer">
              <p>Khaos Kontrol - Industrial Management System</p>
              <p style="color: #555; font-size: 10px;">Este é um email automático. Por favor, não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Khaos Kontrol <convites@khaoskontrol.com.br>',
        to: [to],
        subject: `${makeup_artist_name} te convidou para ser Assistente 🎨`,
        html: emailHtml,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      throw new Error(resendData.message || 'Failed to send email via Resend')
    }

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

      await supabase.from('notification_logs').insert({
        invite_id,
        type: 'email',
        recipient: to,
        status: 'sent',
        provider_id: resendData.id,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        email_id: resendData.id,
        message: 'Email sent successfully',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  } catch (error: any) {
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        const body = await req.json()

        await supabase.from('notification_logs').insert({
          invite_id: body.invite_id,
          type: 'email',
          recipient: body.to,
          status: 'failed',
          error_message: error.message,
        })
      } catch (logError) {}
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
})
