import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'
import { logEdgeError } from '../_shared/log-error.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const FROM_EMAIL =
  Deno.env.get('OFFICIAL_EMAIL_KHAOS') ??
  'Khaos Kontrol <noreply@khaoskontrol.com.br>'

const REPLY_TO = Deno.env.get('REPLY_TO_EMAIL') ?? 'khaoskontrol07@gmail.com'

type PlanType = 'essencial' | 'profissional' | 'studio'

const planCopy: Record<
  PlanType,
  { headline: string; firstSteps: string[]; primaryCtaLabel: string }
> = {
  essencial: {
    headline: 'Bem-vinda ao Khaos Kontrol Essencial',
    firstSteps: [
      'Conecte sua agenda Google em /calendar/callback',
      'Cadastre suas primeiras noivas em /clientes',
      'Gere o primeiro contrato digital em /contratos',
    ],
    primaryCtaLabel: 'Começar a organizar',
  },
  profissional: {
    headline: 'Bem-vinda ao Khaos Kontrol Profissional',
    firstSteps: [
      'Configure follow-up automático por WhatsApp em /automacoes',
      'Personalize o portal das noivas em /clientes',
      'Veja o analytics completo em /analytics',
    ],
    primaryCtaLabel: 'Acessar todas as ferramentas',
  },
  studio: {
    headline: 'Bem-vinda ao Khaos Kontrol Studio',
    firstSteps: [
      'Convide sua equipe em /assistentes',
      'Configure comissões automáticas em /assistentes',
      'Conecte integrações via API em /integracoes',
    ],
    primaryCtaLabel: 'Liderar minha equipe',
  },
}

const buildHtml = (
  firstName: string,
  plan: PlanType,
  trialDays: number,
  origin: string,
) => {
  const copy = planCopy[plan]
  const stepsHtml = copy.firstSteps
    .map(
      (s) =>
        `<li style="padding: 8px 0; border-bottom: 1px solid #1f1f1f; font-size: 14px;">${s}</li>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>${copy.headline}</title></head>
<body style="font-family: 'Courier New', monospace; background:#000; color:#e5e5e5; margin:0; padding:0;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#000; padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; background:#0a0a0a; border:1px solid #1f1f1f;">
        <tr><td style="padding:40px 32px 24px;">
          <p style="font-size:11px; letter-spacing:0.3em; color:#666; text-transform:uppercase; margin:0 0 16px;">Khaos Kontrol</p>
          <h1 style="font-family:Georgia, serif; font-size:28px; font-weight:normal; color:#fff; margin:0 0 16px; line-height:1.2;">${copy.headline}</h1>
          <p style="font-size:14px; color:#999; line-height:1.6; margin:0 0 24px;">
            Olá, ${firstName}. Sua assinatura foi confirmada e você tem ${trialDays} dias grátis pra testar tudo.
          </p>
        </td></tr>
        <tr><td style="padding:0 32px 32px;">
          <p style="font-size:11px; letter-spacing:0.3em; color:#666; text-transform:uppercase; margin:0 0 12px;">Primeiros passos</p>
          <ol style="padding:0 0 0 20px; margin:0; color:#ccc;">${stepsHtml}</ol>
        </td></tr>
        <tr><td style="padding:0 32px 40px;" align="center">
          <a href="${origin}/dashboard" style="display:inline-block; background:#fff; color:#000; padding:14px 32px; text-decoration:none; font-size:13px; letter-spacing:0.15em; text-transform:uppercase; font-weight:bold;">${copy.primaryCtaLabel} →</a>
        </td></tr>
        <tr><td style="padding:24px 32px; border-top:1px solid #1f1f1f; font-size:11px; color:#555; line-height:1.6;">
          Dúvidas? Responda esse email. Para cancelar ou trocar de plano, vá em <a href="${origin}/configuracoes/assinatura" style="color:#999;">Configurações → Assinatura</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('RESEND_API_KEY')
    if (!apiKey) throw new Error('RESEND_API_KEY missing')

    const { user_id, plan_type, trial_days = 14 } = await req.json()
    if (!user_id || !plan_type) {
      throw new Error('Missing user_id or plan_type')
    }

    const validPlans: PlanType[] = ['essencial', 'profissional', 'studio']
    if (!validPlans.includes(plan_type)) {
      throw new Error(`Invalid plan_type: ${plan_type}`)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Email vai pra conta auth (canônica). Nome vem de profiles ou
    // makeup_artists, com fallback genérico.
    const { data: authUser, error: authErr } =
      await supabase.auth.admin.getUserById(user_id)
    if (authErr || !authUser?.user?.email) {
      throw new Error('User email not found')
    }
    const email = authUser.user.email

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user_id)
      .maybeSingle()

    const fullName =
      profile?.full_name ?? authUser.user.user_metadata?.full_name ?? ''
    const firstName = fullName.split(' ')[0] || 'profissional'

    const origin =
      req.headers.get('origin') ?? 'https://khaoskontrol.com.br'

    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      reply_to: REPLY_TO,
      subject: planCopy[plan_type as PlanType].headline,
      html: buildHtml(firstName, plan_type as PlanType, trial_days, origin),
    })

    if (result.error) throw new Error(result.error.message)

    return new Response(
      JSON.stringify({ success: true, email_id: result.data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    await logEdgeError('send-subscription-welcome', error)
    const msg = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
