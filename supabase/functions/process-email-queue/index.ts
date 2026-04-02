import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  SESClient,
  SendEmailCommand,
} from 'https://esm.sh/@aws-sdk/client-ses@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const ses = new SESClient({
  region: Deno.env.get('AWS_REGION_KHAOS') || 'us-east-1',
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID_KHAOS')!,
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY_KHAOS')!,
  },
})

const SOURCE_EMAIL =
  Deno.env.get('OFFICIAL_EMAIL_KHAOS') || 'noreply@khaoskontrol.com.br'
const APP_URL = 'https://khaoskontrol.com.br'

const templates: Record<
  string,
  (data: Record<string, string>) => { subject: string; html: string }
> = {
  welcome_mua: (data) => ({
    subject: 'Bem-vinda ao Khaos Kontrol!',
    html: emailLayout(`
      <p class="greeting">Oi ${data.name}!</p>
      <p>Sua conta no <strong>Khaos Kontrol</strong> foi criada com sucesso.</p>
      <p>Nos próximos 14 dias você tem acesso completo a todas as funcionalidades — sem compromisso, sem cartão de crédito.</p>
      <p>Comece agora:</p>
      <div class="steps">
        <div class="step"><span class="step-n">1</span> Complete seu perfil profissional</div>
        <div class="step"><span class="step-n">2</span> Cadastre sua primeira cliente</div>
        <div class="step"><span class="step-n">3</span> Gere seu primeiro contrato digital</div>
      </div>
      ${ctaButton('Acessar meu painel', `${APP_URL}/dashboard`)}
    `),
  }),

  onboarding_day1: (data) => ({
    subject: `${data.name}, já cadastrou sua primeira cliente?`,
    html: emailLayout(`
      <p class="greeting">Oi ${data.name}!</p>
      <p>Profissionais que cadastram a primeira cliente no primeiro dia têm <strong>3x mais chance</strong> de continuar usando o sistema.</p>
      <p>Leva menos de 30 segundos:</p>
      ${ctaButton('Cadastrar primeira cliente', `${APP_URL}/clientes`)}
      <p style="font-size: 12px; color: #666;">Dica: Pode ser uma cliente que você já atende. Só colocar nome e telefone.</p>
    `),
  }),

  onboarding_day3: (data) => ({
    subject: `${data.name}, já gerou seu primeiro contrato digital?`,
    html: emailLayout(`
      <p class="greeting">Oi ${data.name}!</p>
      <p>Contratos digitais com assinatura eletrônica passam mais profissionalismo e protegem você juridicamente.</p>
      <p>No Khaos Kontrol você gera em 2 minutos — com seu logo, seus termos, e assinatura digital da cliente.</p>
      ${ctaButton('Criar meu primeiro contrato', `${APP_URL}/contratos`)}
    `),
  }),

  onboarding_day7: (data) => ({
    subject: `${data.name}, metade do seu trial já passou!`,
    html: emailLayout(`
      <p class="greeting">Oi ${data.name}!</p>
      <p>Você está na metade dos seus 14 dias de teste. Aqui está o que você pode explorar esta semana:</p>
      <div class="steps">
        <div class="step"><span class="step-n">→</span> Sincronizar sua agenda com Google Calendar</div>
        <div class="step"><span class="step-n">→</span> Enviar o portal exclusivo para uma noiva</div>
        <div class="step"><span class="step-n">→</span> Ver o relatório financeiro do mês</div>
      </div>
      ${ctaButton('Explorar funcionalidades', `${APP_URL}/dashboard`)}
    `),
  }),

  trial_expiring_3days: (data) => ({
    subject: `${data.name}, seu teste acaba em 3 dias`,
    html: emailLayout(`
      <p class="greeting">Oi ${data.name}!</p>
      <p>Seu período de teste gratuito acaba em <strong>3 dias</strong>.</p>
      <p>Para continuar com acesso a clientes ilimitados, contratos digitais e portal da noiva, escolha um plano:</p>
      ${ctaButton('Ver planos a partir de R$31,92/mês', `${APP_URL}/planos`)}
      <p style="font-size: 12px; color: #666;">Sem compromisso. Cancele quando quiser.</p>
    `),
  }),

  trial_expiring_1day: (data) => ({
    subject: `Último dia do seu teste, ${data.name}`,
    html: emailLayout(`
      <p class="greeting">Oi ${data.name}!</p>
      <p>Amanhã seu acesso ao Khaos Kontrol será limitado ao plano gratuito.</p>
      <p>Suas clientes, contratos e dados continuam salvos — mas algumas funcionalidades ficam indisponíveis.</p>
      <p><strong>Assine agora e não perca nada:</strong></p>
      ${ctaButton('Garantir meu plano', `${APP_URL}/planos`)}
    `),
  }),

  trial_expired: (data) => ({
    subject: `${data.name}, seu teste acabou — mas seus dados estão salvos`,
    html: emailLayout(`
      <p class="greeting">Oi ${data.name}!</p>
      <p>Seu período de teste gratuito terminou.</p>
      <p>Não se preocupe — <strong>todos os seus dados estão salvos</strong>. Suas clientes, contratos e agenda continuam lá esperando por você.</p>
      <p>Para desbloquear tudo novamente:</p>
      ${ctaButton('Assinar agora', `${APP_URL}/planos`)}
      <p style="font-size: 12px; color: #666;">Planos a partir de R$31,92/mês. Menos que um almoço por semana.</p>
    `),
  }),
}

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; }
    .header { padding: 32px 24px 16px; border-bottom: 1px solid #eee; }
    .header h1 { font-size: 18px; font-weight: 700; color: #000; margin: 0; letter-spacing: 1px; }
    .body { padding: 32px 24px; }
    .greeting { font-size: 16px; font-weight: 600; color: #000; margin-bottom: 16px; }
    .body p { font-size: 14px; color: #444; line-height: 1.7; margin: 12px 0; }
    .steps { margin: 20px 0; }
    .step { padding: 10px 16px; border-left: 2px solid #000; margin-bottom: 8px; font-size: 14px; color: #333; }
    .step-n { font-weight: 700; color: #000; margin-right: 8px; }
    .cta { text-align: center; margin: 28px 0; }
    .cta a { display: inline-block; background: #000; color: #fff; padding: 14px 32px; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; }
    .footer { padding: 24px; text-align: center; border-top: 1px solid #eee; }
    .footer p { font-size: 11px; color: #999; margin: 4px 0; }
    .footer a { color: #666; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Khaos Kontrol</h1></div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>Khaos Kontrol — Gestão para maquiadoras profissionais</p>
      <p><a href="${APP_URL}">khaoskontrol.com.br</a></p>
    </div>
  </div>
</body>
</html>`
}

function ctaButton(text: string, url: string): string {
  return `<div class="cta"><a href="${url}">${text}</a></div>`
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: emails, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(20)

  if (error || !emails?.length) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  let failed = 0

  for (const email of emails) {
    const templateFn = templates[email.template]
    if (!templateFn) {
      await supabase
        .from('email_queue')
        .update({ status: 'failed', error_message: 'Template not found' })
        .eq('id', email.id)
      failed++
      continue
    }

    if (email.template.startsWith('trial_')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', email.user_id)
        .single()

      if (profile?.subscription_status === 'active') {
        await supabase
          .from('email_queue')
          .update({ status: 'cancelled' })
          .eq('id', email.id)
        continue
      }
    }

    const { subject, html } = templateFn(email.template_data || {})

    try {
      await ses.send(
        new SendEmailCommand({
          Source: SOURCE_EMAIL,
          Destination: { ToAddresses: [email.email_to] },
          Message: {
            Subject: { Data: subject },
            Body: { Html: { Data: html } },
          },
        }),
      )

      await supabase
        .from('email_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', email.id)
      sent++
    } catch (err: any) {
      await supabase
        .from('email_queue')
        .update({ status: 'failed', error_message: err.message })
        .eq('id', email.id)
      failed++
    }
  }

  return new Response(
    JSON.stringify({ processed: emails.length, sent, failed }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
})
