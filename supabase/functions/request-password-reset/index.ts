import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL =
  Deno.env.get('OFFICIAL_EMAIL_KHAOS') ??
  'Khaos Kontrol <noreply@khaoskontrol.com.br>'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const resetTemplate = (recoveryLink: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#000;font-family:'Courier New',monospace;color:#e5e5e5;">
    <div style="max-width:600px;margin:0 auto;background:#0c0c0c;border:1px solid #333;">
      <div style="padding:40px 24px;text-align:center;border-bottom:1px solid #333;">
        <h1 style="color:#fff;font-size:22px;letter-spacing:4px;text-transform:uppercase;margin:0;font-weight:normal;">
          KONTROL // SECURITY
        </h1>
      </div>
      <div style="padding:40px 32px;">
        <p style="color:#fff;font-size:15px;text-transform:uppercase;letter-spacing:1px;">Redefinição de senha solicitada</p>
        <p style="color:#a3a3a3;font-size:14px;line-height:1.7;">
          Recebemos um pedido para redefinir sua senha no Khaos Kontrol. Se foi você, clique no botão abaixo.
          O link expira em 1 hora.
        </p>
        <div style="text-align:center;margin:40px 0;">
          <a href="${recoveryLink}" style="display:inline-block;background:#fff;color:#000;padding:16px 40px;text-decoration:none;text-transform:uppercase;letter-spacing:2px;font-size:12px;font-weight:bold;">
            REDEFINIR SENHA
          </a>
        </div>
        <p style="color:#666;font-size:12px;text-align:center;">
          Se você não pediu isso, ignore este email. Sua senha permanece inalterada.
        </p>
      </div>
      <div style="padding:24px;text-align:center;border-top:1px solid #333;">
        <p style="color:#444;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0;">
          KHAOS KONTROL // COPYRIGHT © ${new Date().getFullYear()}
        </p>
      </div>
    </div>
  </body>
</html>
`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
  const limit = checkRateLimit(clientIp, { maxRequests: 5, windowMs: 60000 })
  if (!limit.allowed) return rateLimitResponse(limit.resetAt)

  try {
    const { email } = (await req.json()) as { email?: string }
    if (!email) return json({ error: 'Email is required' }, 400)

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return json({ error: 'Supabase credentials missing' }, 500)
    }
    if (!RESEND_API_KEY) {
      return json({ error: 'RESEND_API_KEY missing' }, 500)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    if (error) return json({ error: error.message }, 400)
    const recoveryLink = data?.properties?.action_link
    if (!recoveryLink) return json({ error: 'Failed to generate link' }, 500)

    const resend = new Resend(RESEND_API_KEY)
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Redefinição de senha — Khaos Kontrol',
      html: resetTemplate(recoveryLink),
    })

    if (result.error) return json({ error: result.error.message }, 502)
    return json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return json({ error: msg }, 500)
  }
})
