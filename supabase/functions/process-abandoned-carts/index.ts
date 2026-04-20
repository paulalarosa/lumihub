import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

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

const abandonedCartTemplate = (name: string, planName: string, checkoutUrl: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#000;font-family:'Courier New',monospace;color:#e5e5e5;">
    <div style="max-width:600px;margin:0 auto;background:#0c0c0c;border:1px solid #333;">
      <div style="padding:40px 24px;text-align:center;border-bottom:1px solid #333;">
        <h1 style="color:#fff;font-size:22px;letter-spacing:4px;text-transform:uppercase;margin:0;font-weight:normal;">
          KONTROL // SEU PLANO AGUARDA
        </h1>
      </div>
      <div style="padding:40px 32px;">
        <p style="color:#fff;font-size:15px;text-transform:uppercase;letter-spacing:1px;">Olá, ${name}</p>
        <p style="color:#a3a3a3;font-size:14px;line-height:1.7;">
          Notamos que você iniciou a assinatura do plano <strong style="color:#fff;">${planName}</strong> mas não concluiu.
          Seu acesso completo ao Khaos Kontrol está a 1 clique de ser ativado.
        </p>
        <div style="text-align:center;margin:40px 0;">
          <a href="${checkoutUrl}" style="display:inline-block;background:#fff;color:#000;padding:16px 40px;text-decoration:none;text-transform:uppercase;letter-spacing:2px;font-size:12px;font-weight:bold;">
            CONTINUAR ASSINATURA
          </a>
        </div>
        <p style="color:#666;font-size:12px;text-align:center;">
          Se mudou de ideia, basta ignorar este email.
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

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return json({ error: 'Supabase credentials missing' }, 500)
    }
    if (!RESEND_API_KEY) {
      return json({ error: 'RESEND_API_KEY missing' }, 500)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const resend = new Resend(RESEND_API_KEY)

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString()

    const { data: abandonedPayments, error: fetchError } = await supabase
      .from('payments')
      .select('*, user_id')
      .eq('status', 'pending')
      .gt('created_at', twentyFourHoursAgo)
      .lt('created_at', oneHourAgo)

    if (fetchError) return json({ error: fetchError.message }, 500)
    if (!abandonedPayments || abandonedPayments.length === 0) {
      return json({ message: 'No abandoned carts found' })
    }

    const results: Array<Record<string, unknown>> = []

    for (const payment of abandonedPayments) {
      const { data: userData } = await supabase.auth.admin.getUserById(
        payment.user_id,
      )
      const userEmail = userData?.user?.email
      if (!userEmail) continue

      const { data: profile } = await supabase
        .from('profiles')
        .select('email_status')
        .eq('email', userEmail)
        .maybeSingle()

      if (
        profile?.email_status === 'invalid' ||
        profile?.email_status === 'unsubscribed'
      ) {
        continue
      }

      try {
        const name = userData.user.user_metadata?.full_name || 'Cliente'
        const planName = payment.metadata?.plan_type || 'PRO'
        const checkoutUrl = 'https://khaoskontrol.com.br/upgrade'

        const emailRes = await resend.emails.send({
          from: FROM_EMAIL,
          to: userEmail,
          subject: 'Seu plano Khaos Kontrol está esperando',
          html: abandonedCartTemplate(name, planName, checkoutUrl),
        })

        if (emailRes.error) throw new Error(emailRes.error.message)

        results.push({ email: userEmail, status: 'sent', id: emailRes.data?.id })

        await supabase
          .from('payments')
          .update({
            metadata: { ...payment.metadata, abandoned_email_sent: true },
          })
          .eq('id', payment.id)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown'
        results.push({ email: userEmail, status: 'failed', error: msg })
      }
    }

    return json({ success: true, processed: results })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return json({ error: msg }, 500)
  }
})
