import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@2.0.0'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL =
  Deno.env.get('OFFICIAL_EMAIL_KHAOS') ??
  'Khaos Kontrol <noreply@khaoskontrol.com.br>'
const HOOK_SECRET = Deno.env.get('SEND_EMAIL_HOOK_SECRET')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, webhook-id, webhook-signature, webhook-timestamp',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

type EmailAction =
  | 'signup'
  | 'login'
  | 'invite'
  | 'recovery'
  | 'email_change_current'
  | 'email_change_new'
  | 'magiclink'
  | 'reauthentication'

interface HookPayload {
  user: {
    email: string
    user_metadata?: Record<string, unknown>
  }
  email_data: {
    token: string
    token_hash: string
    redirect_to?: string
    email_action_type: EmailAction
    site_url: string
    token_new?: string
    token_hash_new?: string
  }
}

const baseStyle = `
font-family: 'Courier New', monospace; background:#000; color:#e5e5e5;
`

const wrap = (title: string, bodyHtml: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;${baseStyle}">
    <div style="max-width:600px;margin:0 auto;background:#0c0c0c;border:1px solid #333;">
      <div style="padding:40px 24px;text-align:center;border-bottom:1px solid #333;">
        <h1 style="color:#fff;font-size:22px;letter-spacing:4px;text-transform:uppercase;margin:0;font-weight:normal;">
          ${title}
        </h1>
      </div>
      <div style="padding:40px 32px;">${bodyHtml}</div>
      <div style="padding:24px;text-align:center;border-top:1px solid #333;">
        <p style="color:#444;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0;">
          KHAOS KONTROL // COPYRIGHT © ${new Date().getFullYear()}
        </p>
      </div>
    </div>
  </body>
</html>
`

const ctaButton = (href: string, label: string) => `
<div style="text-align:center;margin:40px 0;">
  <a href="${href}" style="display:inline-block;background:#fff;color:#000;padding:16px 40px;text-decoration:none;text-transform:uppercase;letter-spacing:2px;font-size:12px;font-weight:bold;">
    ${label}
  </a>
</div>
`

const buildLink = (payload: HookPayload, useNewToken = false) => {
  const { site_url, token_hash, token_hash_new, email_action_type, redirect_to } =
    payload.email_data
  const hash = useNewToken ? token_hash_new : token_hash
  const redirect = redirect_to ?? site_url
  return `${site_url}/auth/v1/verify?token=${hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect)}`
}

const renderEmail = (
  payload: HookPayload,
): { subject: string; html: string } => {
  const action = payload.email_data.email_action_type
  const link = buildLink(payload)
  const name =
    (payload.user.user_metadata?.full_name as string) ||
    payload.user.email.split('@')[0]

  switch (action) {
    case 'signup':
      return {
        subject: 'Confirme seu acesso — Khaos Kontrol',
        html: wrap(
          'KONTROL // ACESSO',
          `<p style="color:#fff;text-transform:uppercase;letter-spacing:1px;">Olá ${name},</p>
           <p style="color:#a3a3a3;line-height:1.7;">Confirma seu email pra ativar sua conta no Khaos Kontrol.</p>
           ${ctaButton(link, 'CONFIRMAR EMAIL')}
           <p style="color:#666;font-size:12px;text-align:center;">Link expira em 1 hora.</p>`,
        ),
      }
    case 'recovery':
      return {
        subject: 'Redefinição de senha — Khaos Kontrol',
        html: wrap(
          'KONTROL // SECURITY',
          `<p style="color:#fff;text-transform:uppercase;letter-spacing:1px;">Redefinição solicitada</p>
           <p style="color:#a3a3a3;line-height:1.7;">Clique pra criar uma nova senha. Se não foi você, ignore.</p>
           ${ctaButton(link, 'REDEFINIR SENHA')}
           <p style="color:#666;font-size:12px;text-align:center;">Link expira em 1 hora.</p>`,
        ),
      }
    case 'magiclink':
      return {
        subject: 'Seu link de acesso — Khaos Kontrol',
        html: wrap(
          'KONTROL // MAGIC LINK',
          `<p style="color:#fff;text-transform:uppercase;letter-spacing:1px;">Entrar no Khaos Kontrol</p>
           <p style="color:#a3a3a3;line-height:1.7;">Use o link abaixo pra entrar sem senha.</p>
           ${ctaButton(link, 'ENTRAR')}`,
        ),
      }
    case 'invite':
      return {
        subject: 'Você foi convidada — Khaos Kontrol',
        html: wrap(
          'KONTROL // CONVITE',
          `<p style="color:#fff;text-transform:uppercase;letter-spacing:1px;">Olá ${name},</p>
           <p style="color:#a3a3a3;line-height:1.7;">Você foi convidada pra integrar uma equipe no Khaos Kontrol.</p>
           ${ctaButton(link, 'ACEITAR CONVITE')}`,
        ),
      }
    case 'email_change_current':
    case 'email_change_new':
      return {
        subject: 'Confirme a alteração de email — Khaos Kontrol',
        html: wrap(
          'KONTROL // EMAIL CHANGE',
          `<p style="color:#fff;text-transform:uppercase;letter-spacing:1px;">Confirme a alteração</p>
           <p style="color:#a3a3a3;line-height:1.7;">Confirma o novo endereço clicando abaixo.</p>
           ${ctaButton(link, 'CONFIRMAR')}`,
        ),
      }
    case 'reauthentication':
      return {
        subject: 'Código de reautenticação — Khaos Kontrol',
        html: wrap(
          'KONTROL // REAUTH',
          `<p style="color:#fff;text-transform:uppercase;letter-spacing:1px;">Código de verificação</p>
           <p style="color:#a3a3a3;line-height:1.7;">Use este código no app pra confirmar sua identidade:</p>
           <div style="text-align:center;margin:32px 0;">
             <span style="display:inline-block;background:#111;border:1px solid #fff;padding:20px 32px;font-size:28px;letter-spacing:8px;color:#fff;font-weight:bold;">
               ${payload.email_data.token}
             </span>
           </div>`,
        ),
      }
    default:
      return {
        subject: 'Notificação — Khaos Kontrol',
        html: wrap(
          'KONTROL',
          `<p style="color:#a3a3a3;line-height:1.7;">Você recebeu uma notificação do Khaos Kontrol.</p>
           ${ctaButton(link, 'ACESSAR')}`,
        ),
      }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY missing' }, 500)

    const rawBody = await req.text()
    let payload: HookPayload

    if (HOOK_SECRET) {
      const headers = Object.fromEntries(req.headers)
      const base64Secret = HOOK_SECRET.replace(/^v1,whsec_/, '')
      const wh = new Webhook(base64Secret)
      payload = wh.verify(rawBody, headers) as HookPayload
    } else {
      payload = JSON.parse(rawBody) as HookPayload
    }

    const { subject, html } = renderEmail(payload)

    const resend = new Resend(RESEND_API_KEY)
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: payload.user.email,
      subject,
      html,
    })

    if (result.error) return json({ error: result.error.message }, 502)
    return json({ success: true, id: result.data?.id })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return json({ error: msg }, 500)
  }
})
