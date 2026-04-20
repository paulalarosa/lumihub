import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

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

const FROM =
  Deno.env.get('OFFICIAL_EMAIL_KHAOS') ??
  'Khaos Kontrol <noreply@khaoskontrol.com.br>'
const currencyBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface DigestStats {
  user_id: string
  email: string
  name: string
  new_clients: number
  new_projects: number
  events_tomorrow: number
  paid_today: number
  revenue_today: number
  overdue_count: number
  overdue_amount: number
  workflow_runs_today: number
  workflow_failures_today: number
}

async function computeDigest(
  userId: string,
  sb: ReturnType<typeof createClient>,
): Promise<Omit<DigestStats, 'email' | 'name'> | null> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().slice(0, 10)

  const [
    { count: newClients },
    { count: newProjects },
    { count: eventsTomorrow },
    { data: paid },
    { data: overdue },
    { data: workflowRuns },
  ] = await Promise.all([
    sb
      .from('wedding_clients')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfYesterday),
    sb
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfYesterday),
    sb
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_date', tomorrow),
    sb
      .from('invoices')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .gte('paid_at', startOfYesterday),
    sb
      .from('invoices')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'overdue'),
    sb
      .from('workflow_executions')
      .select('status, workflow_id, workflows!inner(user_id)')
      .eq('workflows.user_id', userId)
      .gte('started_at', startOfDay),
  ])

  const revenueToday = (paid ?? []).reduce(
    (acc, r) => acc + Number(r.amount || 0),
    0,
  )
  const overdueTotal = (overdue ?? []).reduce(
    (acc, r) => acc + Number(r.amount || 0),
    0,
  )
  const runs = workflowRuns ?? []
  const runsToday = runs.length
  const runsFailed = runs.filter(
    (r) => r.status === 'partial_failure',
  ).length

  const hasActivity =
    (newClients ?? 0) > 0 ||
    (newProjects ?? 0) > 0 ||
    (eventsTomorrow ?? 0) > 0 ||
    (paid?.length ?? 0) > 0 ||
    overdueTotal > 0 ||
    runsToday > 0

  if (!hasActivity) return null

  return {
    user_id: userId,
    new_clients: newClients ?? 0,
    new_projects: newProjects ?? 0,
    events_tomorrow: eventsTomorrow ?? 0,
    paid_today: paid?.length ?? 0,
    revenue_today: revenueToday,
    overdue_count: overdue?.length ?? 0,
    overdue_amount: overdueTotal,
    workflow_runs_today: runsToday,
    workflow_failures_today: runsFailed,
  }
}

const digestHTML = (s: DigestStats, dateLabel: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#000;font-family:'Courier New',monospace;color:#e5e5e5;">
    <div style="max-width:600px;margin:0 auto;background:#0c0c0c;border:1px solid #333;">
      <div style="padding:32px 24px;text-align:center;border-bottom:1px solid #333;">
        <h1 style="color:#fff;font-size:20px;letter-spacing:4px;text-transform:uppercase;margin:0;font-weight:normal;">
          KONTROL // DIGEST
        </h1>
        <p style="color:#888;font-size:11px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">${dateLabel}</p>
      </div>
      <div style="padding:32px;">
        <p style="color:#fff;font-size:14px;margin-bottom:24px;">Olá ${s.name},</p>
        <p style="color:#a3a3a3;font-size:13px;line-height:1.6;margin:0 0 24px;">
          Resumo do que rolou no seu Khaos Kontrol nas últimas 24h:
        </p>

        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          ${row('Clientes novas', s.new_clients)}
          ${row('Projetos novos', s.new_projects)}
          ${row('Eventos amanhã', s.events_tomorrow)}
          ${row('Faturas pagas hoje', `${s.paid_today} · ${currencyBRL(s.revenue_today)}`, '#10b981')}
          ${s.overdue_count > 0 ? row('Faturas vencidas', `${s.overdue_count} · ${currencyBRL(s.overdue_amount)}`, '#ef4444') : ''}
          ${row('Automações executadas', s.workflow_runs_today)}
          ${s.workflow_failures_today > 0 ? row('Automações com falha', s.workflow_failures_today, '#f59e0b') : ''}
        </table>

        <div style="text-align:center;margin:32px 0;">
          <a href="https://khaoskontrol.com.br/dashboard" style="display:inline-block;background:#fff;color:#000;padding:14px 32px;text-decoration:none;text-transform:uppercase;letter-spacing:2px;font-size:11px;font-weight:bold;">
            ABRIR DASHBOARD
          </a>
        </div>
      </div>
      <div style="padding:20px;text-align:center;border-top:1px solid #333;">
        <p style="color:#444;font-size:9px;text-transform:uppercase;letter-spacing:2px;margin:0;">
          KHAOS KONTROL · ${new Date().getFullYear()}
        </p>
      </div>
    </div>
  </body>
</html>
`

const row = (label: string, value: string | number, color = '#fff') => `
<tr>
  <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${label}</td>
  <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;color:${color};font-size:14px;font-weight:bold;text-align:right;">${value}</td>
</tr>
`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) return json({ error: 'RESEND_API_KEY missing' }, 500)
    const resend = new Resend(resendKey)

    // Query string ?user_id=... to test for a single user
    const url = new URL(req.url)
    const singleUserId = url.searchParams.get('user_id')

    let users: Array<{ id: string; email: string | null; full_name: string | null }> = []
    if (singleUserId) {
      const { data } = await sb
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', singleUserId)
        .single()
      if (data) users = [data]
    } else {
      // Only owners who have an active or trial subscription
      const { data } = await sb
        .from('profiles')
        .select('id, email, full_name')
        .is('parent_user_id', null)
        .in('subscription_status', ['active', 'trial', 'trialing'])
      users = data ?? []
    }

    const dateLabel = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    const results: Array<{ user_id: string; sent: boolean; reason?: string }> = []

    for (const u of users) {
      if (!u.email) {
        results.push({ user_id: u.id, sent: false, reason: 'no email' })
        continue
      }
      const digest = await computeDigest(u.id, sb)
      if (!digest) {
        results.push({ user_id: u.id, sent: false, reason: 'no activity' })
        continue
      }

      try {
        const res = await resend.emails.send({
          from: FROM,
          to: u.email,
          subject: `Resumo do dia — Khaos Kontrol`,
          html: digestHTML(
            { ...digest, email: u.email, name: u.full_name ?? 'por aqui' },
            dateLabel,
          ),
        })
        if (res.error) {
          results.push({ user_id: u.id, sent: false, reason: res.error.message })
        } else {
          results.push({ user_id: u.id, sent: true })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown'
        results.push({ user_id: u.id, sent: false, reason: msg })
      }
    }

    return json({ processed: users.length, results })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return json({ error: msg }, 500)
  }
})
