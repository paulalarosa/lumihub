import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface InvoiceEmailPayload {
  variant: 'created' | 'paid'
  to: string
  invoice_number: string
  amount: string
  client_name: string
  due_date?: string
  paid_at?: string
  user_id?: string
}

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #050505; color: #fff; }
  .wrap { padding: 48px 16px; background: #050505; }
  .card { max-width: 560px; margin: 0 auto; background: #0a0a0a; border: 1px solid rgba(255,255,255,0.08); }
  .header { padding: 40px 40px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .brand { font-family: Georgia, serif; font-size: 22px; letter-spacing: 2px; color: #fff; }
  .eyebrow { font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 3px; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-top: 4px; }
  .body { padding: 48px 40px 32px; }
  .title { font-family: Georgia, serif; font-size: 28px; font-weight: 400; line-height: 1.2; margin: 0 0 24px; color: #fff; }
  table.detail { width: 100%; border-collapse: collapse; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 32px; }
  table.detail td { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  table.detail tr:last-child td { border-bottom: none; }
  .label { font-family: 'Courier New', monospace; font-size: 9px; letter-spacing: 2px; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-bottom: 4px; }
  .value { font-size: 14px; color: rgba(255,255,255,0.85); }
  .value-big { font-family: Georgia, serif; font-size: 24px; color: #fff; }
  .btn { display: inline-block; background: #fff; color: #000; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; padding: 14px 32px; text-decoration: none; }
  .footer { padding: 24px 40px; background: #050505; text-align: center; }
  .footer p { font-family: 'Courier New', monospace; font-size: 9px; letter-spacing: 2px; color: rgba(255,255,255,0.3); text-transform: uppercase; margin: 0; }
`

const invoiceCreatedTemplate = (p: InvoiceEmailPayload) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${baseStyles}</style></head><body>
<div class="wrap"><div class="card">
  <div class="header">
    <div class="brand">KHAOS_KONTROL</div>
    <div class="eyebrow">Fatura emitida</div>
  </div>
  <div class="body">
    <div class="eyebrow" style="margin-bottom:16px;">Nova fatura gerada</div>
    <h1 class="title">${p.invoice_number}</h1>
    <table class="detail">
      <tr><td><div class="label">Valor</div><div class="value-big">${p.amount}</div></td></tr>
      <tr><td><div class="label">Cliente</div><div class="value">${p.client_name}</div></td></tr>
      <tr><td><div class="label">Vencimento</div><div class="value">${p.due_date ?? 'A definir'}</div></td></tr>
    </table>
    <a href="https://khaoskontrol.com.br/billing" class="btn">Ver no painel</a>
  </div>
  <div class="footer"><p>KHAOSKONTROL.COM.BR</p></div>
</div></div></body></html>`

const invoicePaidTemplate = (p: InvoiceEmailPayload) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${baseStyles}</style></head><body>
<div class="wrap"><div class="card">
  <div class="header">
    <div class="brand">KHAOS_KONTROL</div>
    <div class="eyebrow">Confirmação de pagamento</div>
  </div>
  <div class="body" style="text-align:center;">
    <div class="eyebrow" style="margin-bottom:16px;">Pagamento recebido</div>
    <h1 class="title" style="font-size:32px;">${p.amount}</h1>
    <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:32px;">Fatura ${p.invoice_number} · ${p.paid_at ?? ''}</div>
    <div style="padding:20px;border:1px solid rgba(255,255,255,0.1);margin-bottom:32px;text-align:left;">
      <div class="label" style="margin-bottom:8px;">Pago por</div>
      <div class="value">${p.client_name}</div>
    </div>
    <a href="https://khaoskontrol.com.br/billing" class="btn">Ver histórico</a>
  </div>
  <div class="footer"><p>KHAOSKONTROL.COM.BR</p></div>
</div></div></body></html>`

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = (await req.json()) as InvoiceEmailPayload

    if (!payload.to || !payload.variant) {
      return new Response(JSON.stringify({ error: 'Missing to or variant' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: recipientStatus } = await supabaseClient
      .from('profiles')
      .select('email_status')
      .eq('email', payload.to)
      .maybeSingle()

    if (
      recipientStatus?.email_status === 'invalid' ||
      recipientStatus?.email_status === 'unsubscribed'
    ) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'recipient_suppressed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
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

    const FROM =
      Deno.env.get('OFFICIAL_EMAIL_KHAOS') ??
      'Khaos Kontrol <noreply@khaoskontrol.com.br>'

    const subject =
      payload.variant === 'paid'
        ? `Pagamento recebido · ${payload.amount}`
        : `Nova fatura ${payload.invoice_number} · ${payload.amount}`

    const html =
      payload.variant === 'paid'
        ? invoicePaidTemplate(payload)
        : invoiceCreatedTemplate(payload)

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: payload.to,
      subject,
      html,
    })

    if (error) throw new Error(error.message ?? 'resend_error')

    try {
      await supabaseClient.from('notification_logs').insert({
        user_id: payload.user_id ?? null,
        type: 'email',
        recipient: payload.to,
        status: 'sent',
        provider_id: data?.id,
        metadata: { template: `invoice_${payload.variant}`, provider: 'resend' },
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
