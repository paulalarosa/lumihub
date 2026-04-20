import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface BookingEmailPayload {
  to: string
  client_name: string
  professional_name: string
  service_name: string
  event_date: string
  event_time: string
  duration_minutes: number
  user_id?: string
}

const bookingTemplate = (p: BookingEmailPayload) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #050505; color: #fff; }
  .wrap { padding: 48px 16px; background: #050505; }
  .card { max-width: 560px; margin: 0 auto; background: #0a0a0a; border: 1px solid rgba(255,255,255,0.08); }
  .header { padding: 40px 40px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .brand { font-family: Georgia, serif; font-size: 22px; letter-spacing: 2px; color: #fff; }
  .eyebrow { font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 3px; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-top: 4px; }
  .body { padding: 48px 40px 32px; }
  .title { font-family: Georgia, serif; font-size: 28px; font-weight: 400; line-height: 1.3; margin: 0 0 12px; color: #fff; }
  .lead { font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.7); margin: 0 0 32px; }
  table.detail { width: 100%; border-collapse: collapse; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 32px; }
  table.detail td { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  table.detail tr:last-child td { border-bottom: none; }
  .label { font-family: 'Courier New', monospace; font-size: 9px; letter-spacing: 2px; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-bottom: 4px; }
  .value { font-size: 14px; color: rgba(255,255,255,0.9); }
  .value-big { font-family: Georgia, serif; font-size: 18px; color: #fff; }
  .footer { padding: 24px 40px; background: #050505; text-align: center; }
  .footer p { font-family: 'Courier New', monospace; font-size: 9px; letter-spacing: 2px; color: rgba(255,255,255,0.3); text-transform: uppercase; margin: 0; }
</style></head><body>
<div class="wrap"><div class="card">
  <div class="header">
    <div class="brand">KHAOS_KONTROL</div>
    <div class="eyebrow">Agendamento confirmado</div>
  </div>
  <div class="body">
    <div class="eyebrow" style="margin-bottom:16px;">Confirmado</div>
    <h1 class="title">Olá, ${p.client_name}.</h1>
    <p class="lead">Seu agendamento com <strong style="color:#fff;">${p.professional_name}</strong> foi confirmado. Os detalhes abaixo:</p>
    <table class="detail">
      <tr><td><div class="label">Serviço</div><div class="value">${p.service_name}</div></td></tr>
      <tr><td><div class="label">Data e horário</div><div class="value-big">${p.event_date} · ${p.event_time}</div></td></tr>
      <tr><td><div class="label">Duração</div><div class="value">${p.duration_minutes} minutos</div></td></tr>
    </table>
    <p style="font-size:13px;line-height:1.6;color:rgba(255,255,255,0.5);margin:0;">Em caso de dúvidas ou necessidade de reagendamento, entre em contato diretamente com ${p.professional_name}.</p>
  </div>
  <div class="footer"><p>KHAOSKONTROL.COM.BR</p></div>
</div></div></body></html>`

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = (await req.json()) as BookingEmailPayload

    if (!payload.to || !payload.client_name || !payload.event_date) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
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

    const FROM =
      Deno.env.get('OFFICIAL_EMAIL_KHAOS') ??
      'Khaos Kontrol <noreply@khaoskontrol.com.br>'

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: payload.to,
      subject: `Agendamento confirmado · ${payload.event_date}`,
      html: bookingTemplate(payload),
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
        metadata: { template: 'booking_confirmed', provider: 'resend' },
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
