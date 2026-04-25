import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts'
import { logEdgeError } from '../_shared/log-error.ts'

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

interface EmailRequest {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
  text?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
  const limit = checkRateLimit(clientIp, { maxRequests: 30, windowMs: 60000 })
  if (!limit.allowed) return rateLimitResponse(limit.resetAt)

  try {
    const apiKey = Deno.env.get('RESEND_API_KEY')

    // Health check — AdminIntegrations usa essa action pra marcar o cartão
    // de Resend como operacional/degraded em vez de hardcoded "operational".
    // Nunca envia email; só confirma que o secret está lá.
    const probeBody = await req
      .clone()
      .json()
      .catch(() => ({}))
    if ((probeBody as { action?: string }).action === 'check_config') {
      return json({
        ok: !!apiKey,
        configured: !!apiKey,
        missing_keys: apiKey ? [] : ['RESEND_API_KEY'],
      })
    }

    if (!apiKey) return json({ error: 'RESEND_API_KEY not configured' }, 500)

    const body = probeBody as EmailRequest
    const { to, subject, html, text, replyTo } = body
    const from =
      body.from ||
      Deno.env.get('OFFICIAL_EMAIL_KHAOS') ||
      'Khaos Kontrol <noreply@khaoskontrol.com.br>'

    if (!to || !subject || !html) {
      return json({ error: 'Missing to, subject, or html' }, 400)
    }

    const allRecipients = Array.isArray(to) ? to : [to]
    if (allRecipients.length === 0) {
      return json({ error: 'Empty recipient list' }, 400)
    }

    // Drop suppressed addresses (bounced/complained)
    const sb = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    const { data: suppressed } = await sb
      .from('email_suppressions')
      .select('email')
      .in('email', allRecipients.map((e) => e.toLowerCase()))
    const suppressedSet = new Set(
      (suppressed ?? []).map((s: { email: string }) => s.email.toLowerCase()),
    )
    const recipients = allRecipients.filter(
      (e) => !suppressedSet.has(e.toLowerCase()),
    )

    if (recipients.length === 0) {
      return json({ skipped: true, reason: 'all_suppressed' })
    }

    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from,
      to: recipients,
      subject,
      html,
      ...(text ? { text } : {}),
      ...(replyTo ? { replyTo } : {}),
    })

    if (result.error) {
      return json({ error: result.error.message, details: result.error }, 502)
    }

    return json({ success: true, id: result.data?.id })
  } catch (error) {
    await logEdgeError('send-email', error)
    const msg = error instanceof Error ? error.message : String(error)
    return json({ error: msg }, 500)
  }
})
