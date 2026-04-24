import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const FROM =
  Deno.env.get('OFFICIAL_EMAIL_KHAOS') ??
  'Khaos Kontrol <noreply@khaoskontrol.com.br>'
const TO = Deno.env.get('RESEND_TO') ?? 'khaoskontrol07@gmail.com'

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

type AlertType =
  | 'payment_failed'
  | 'system_error'
  | 'workflow_failed'
  | 'cron_failure'
  | 'email_queue_backlog'

interface AlertPayload {
  type: AlertType
  data: Record<string, unknown>
}

function renderSubject(payload: AlertPayload): string {
  switch (payload.type) {
    case 'payment_failed':
      return `[ALERTA] Pagamento falhou — R$ ${payload.data.amount ?? '?'}`
    case 'system_error':
      return `[ALERTA] Erro crítico no sistema`
    case 'workflow_failed':
      return `[ALERTA] Workflow falhou`
    case 'cron_failure':
      return `[ALERTA] Cron job falhou — ${payload.data.count ?? '?'} execuções`
    case 'email_queue_backlog':
      return `[ALERTA] Fila de email travada — ${payload.data.pending_count ?? '?'} pendentes`
  }
}

function renderHtml(payload: AlertPayload): string {
  const rows = Object.entries(payload.data)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-family:monospace;color:#666;font-size:11px;text-transform:uppercase">${k}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-family:monospace;font-size:12px">${String(v ?? '').slice(0, 400)}</td></tr>`,
    )
    .join('')

  const titles: Record<AlertType, string> = {
    payment_failed: 'Pagamento falhou',
    system_error: 'Erro crítico no sistema',
    workflow_failed: 'Workflow falhou',
    cron_failure: 'Cron job falhou',
    email_queue_backlog: 'Fila de email travada',
  }
  const title = titles[payload.type] ?? 'Alerta do sistema'

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0a0a0a;color:#fff">
      <div style="border-left:3px solid #dc2626;padding:16px 20px;background:#1a0a0a;margin-bottom:24px">
        <div style="font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#f87171;font-weight:bold">KHAOS_KONTROL · ALERTA</div>
        <h1 style="font-family:Georgia,serif;font-size:24px;margin:8px 0 0 0;color:#fff">${title}</h1>
      </div>
      <table style="width:100%;border-collapse:collapse;background:#0f0f0f;border:1px solid #222">${rows}</table>
      <p style="font-family:monospace;font-size:10px;color:#666;margin-top:24px;text-transform:uppercase;letter-spacing:1px">
        Gerado automaticamente · ${new Date().toISOString()}
      </p>
    </div>
  `
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('RESEND_API_KEY')
    if (!apiKey) return json({ error: 'RESEND_API_KEY not configured' }, 500)

    const body = (await req.json()) as AlertPayload
    if (!body?.type || !body?.data) {
      return json({ error: 'Invalid payload: expected { type, data }' }, 400)
    }

    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from: FROM,
      to: TO,
      subject: renderSubject(body),
      html: renderHtml(body),
    })

    return json({ ok: true, result })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return json({ error: msg }, 500)
  }
})
