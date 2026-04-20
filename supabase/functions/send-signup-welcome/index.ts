import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SignupWelcomePayload {
  to: string
  name?: string
  user_id?: string
}

const welcomeTemplate = (firstName: string) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #050505; color: #fff; }
  .wrap { padding: 48px 16px; background: #050505; }
  .card { max-width: 560px; margin: 0 auto; background: #0a0a0a; border: 1px solid rgba(255,255,255,0.08); }
  .header { padding: 40px 40px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .brand { font-family: Georgia, serif; font-size: 22px; letter-spacing: 2px; color: #fff; }
  .eyebrow { font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 3px; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-top: 4px; }
  .body { padding: 48px 40px 32px; }
  .title { font-family: Georgia, serif; font-size: 32px; font-weight: 400; line-height: 1.2; letter-spacing: 0.5px; margin: 0 0 16px; color: #fff; }
  .lead { font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.7); margin: 0 0 24px; }
  .btn { display: inline-block; background: #fff; color: #000; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; padding: 14px 32px; text-decoration: none; }
  .steps { padding: 32px 40px; border-top: 1px solid rgba(255,255,255,0.06); }
  .steps-label { font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 2px; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-bottom: 12px; }
  .steps ul { margin: 0; padding: 0; list-style: none; }
  .steps li { font-size: 13px; color: rgba(255,255,255,0.7); padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .steps li:last-child { border-bottom: none; }
  .footer { padding: 24px 40px; background: #050505; text-align: center; }
  .footer p { font-family: 'Courier New', monospace; font-size: 9px; letter-spacing: 2px; color: rgba(255,255,255,0.3); text-transform: uppercase; margin: 0; }
</style></head><body>
<div class="wrap"><div class="card">
  <div class="header">
    <div class="brand">KHAOS_KONTROL</div>
    <div class="eyebrow">Gestão de alta performance</div>
  </div>
  <div class="body">
    <div class="eyebrow" style="margin-bottom:20px;">Bem-vinda</div>
    <h1 class="title">Olá, ${firstName}.</h1>
    <p class="lead">Sua conta no Khaos Kontrol está ativa. Nos próximos 14 dias, você tem acesso completo a toda a plataforma sem cobrança.</p>
    <p class="lead">Comece configurando seu perfil profissional e cadastrando sua primeira cliente. Em 10 minutos, sua operação já está organizada.</p>
    <a href="https://khaoskontrol.com.br/dashboard" class="btn">Acessar Dashboard</a>
  </div>
  <div class="steps">
    <div class="steps-label">Próximos passos</div>
    <ul>
      <li>1. Complete seu perfil em Configurações</li>
      <li>2. Cadastre seus serviços</li>
      <li>3. Conecte o Google Calendar</li>
      <li>4. Cadastre sua primeira cliente</li>
    </ul>
  </div>
  <div class="footer"><p>KHAOSKONTROL.COM.BR</p></div>
</div></div></body></html>`

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = (await req.json()) as SignupWelcomePayload

    if (!payload.to) {
      return new Response(JSON.stringify({ error: 'Missing to' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const resend = new Resend(resendKey)
    const firstName = (payload.name ?? '').split(' ')[0] || 'Profissional'

    const FROM =
      Deno.env.get('OFFICIAL_EMAIL_KHAOS') ??
      'Khaos Kontrol <noreply@khaoskontrol.com.br>'

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: payload.to,
      subject: `Bem-vinda ao Khaos Kontrol, ${firstName}`,
      html: welcomeTemplate(firstName),
    })

    if (error) throw new Error(error.message ?? 'resend_error')

    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      )
      await supabaseClient.from('notification_logs').insert({
        user_id: payload.user_id ?? null,
        type: 'email',
        recipient: payload.to,
        status: 'sent',
        provider_id: data?.id,
        metadata: { template: 'signup_welcome', provider: 'resend' },
      })
    } catch {
      /* ignore */
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
