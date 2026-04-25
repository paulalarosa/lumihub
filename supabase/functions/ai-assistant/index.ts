import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateText, tool } from 'npm:ai'
import { createGoogleGenerativeAI } from 'npm:@ai-sdk/google'
import { createOpenAI } from 'npm:@ai-sdk/openai'
import { z } from 'npm:zod'
import { consumeAiQuota, aiQuotaResponse } from '../_shared/ai-rate-limit.ts'
import { logEdgeError } from '../_shared/log-error.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-ai-provider, x-ai-key, x-ai-model',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, user_id } = await req.json()
    if (!user_id) return json({ error: 'Missing user_id' }, 400)

    // Rate limit antes de tocar em API paga. 50 req/hora é generoso
    // pra uso normal e mata loops/abuso antes de virar centenas de R$.
    const quota = await consumeAiQuota(user_id, 'ai-assistant', 50)
    if (!quota.allowed) return aiQuotaResponse(quota)

    const clientProvider = req.headers.get('x-ai-provider')
    const clientKey = req.headers.get('x-ai-key')
    const clientModel = req.headers.get('x-ai-model')

    const providerType = clientProvider || 'google'
    const apiKey = clientKey || Deno.env.get('GOOGLE_API_KEY') || ''
    const modelId =
      clientModel ||
      (providerType === 'google' ? 'gemini-2.0-flash-exp' : 'gpt-4o')

    let model
    if (providerType === 'google') {
      const google = createGoogleGenerativeAI({ apiKey })
      model = google(modelId)
    } else if (providerType === 'openai') {
      const openai = createOpenAI({ apiKey })
      model = openai(modelId)
    } else {
      return json({ error: `Unsupported provider: ${providerType}` }, 400)
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: profile } = await sb
      .from('profiles')
      .select('parent_user_id')
      .eq('id', user_id)
      .maybeSingle()
    const org_id = profile?.parent_user_id || user_id

    let actionData: unknown = null

    const tools = {
      list_events: tool({
        description:
          'Lista eventos da agenda. Filtra por período (today/tomorrow/week/month) ou range de datas.',
        parameters: z.object({
          period: z.enum(['today', 'tomorrow', 'week', 'month']).optional(),
          start_date: z.string().optional().describe('YYYY-MM-DD'),
          end_date: z.string().optional().describe('YYYY-MM-DD'),
          limit: z.number().optional(),
        }),
        execute: async (args) => {
          let q = sb
            .from('events')
            .select(
              'id, title, event_date, start_time, end_time, location, event_type, status, total_value, client_id',
            )
            .eq('user_id', org_id)
            .order('event_date', { ascending: true })
            .limit(args.limit ?? 20)

          const today = new Date().toISOString().slice(0, 10)
          if (args.period === 'today') {
            q = q.eq('event_date', today)
          } else if (args.period === 'tomorrow') {
            const t = new Date()
            t.setDate(t.getDate() + 1)
            q = q.eq('event_date', t.toISOString().slice(0, 10))
          } else if (args.period === 'week') {
            const end = new Date()
            end.setDate(end.getDate() + 7)
            q = q.gte('event_date', today).lte('event_date', end.toISOString().slice(0, 10))
          } else if (args.period === 'month') {
            const end = new Date()
            end.setDate(end.getDate() + 30)
            q = q.gte('event_date', today).lte('event_date', end.toISOString().slice(0, 10))
          }
          if (args.start_date) q = q.gte('event_date', args.start_date)
          if (args.end_date) q = q.lte('event_date', args.end_date)

          const { data, error } = await q
          if (error) return `Erro: ${error.message}`
          return JSON.stringify(data)
        },
      }),
      create_event: tool({
        description:
          'Cria evento/compromisso na agenda. event_date é obrigatório (YYYY-MM-DD).',
        parameters: z.object({
          title: z.string(),
          event_date: z.string().describe('YYYY-MM-DD'),
          start_time: z.string().optional().describe('ISO 8601 timestamp'),
          end_time: z.string().optional().describe('ISO 8601 timestamp'),
          location: z.string().optional(),
          event_type: z.string().optional(),
          description: z.string().optional(),
          client_id: z.string().uuid().optional(),
          total_value: z.number().optional(),
        }),
        execute: async (args) => {
          const { data, error } = await sb
            .from('events')
            .insert({ ...args, user_id: org_id })
            .select()
            .single()
          if (error) return `Erro: ${error.message}`
          actionData = { type: 'event_created', data }
          return `Evento criado: ${data.title} em ${data.event_date}`
        },
      }),
      update_event: tool({
        description: 'Atualiza um evento existente pelo id.',
        parameters: z.object({
          id: z.string().uuid(),
          title: z.string().optional(),
          event_date: z.string().optional(),
          start_time: z.string().optional(),
          end_time: z.string().optional(),
          location: z.string().optional(),
          status: z.string().optional(),
          notes: z.string().optional(),
          total_value: z.number().optional(),
        }),
        execute: async (args) => {
          const { id, ...patch } = args
          const { data, error } = await sb
            .from('events')
            .update(patch)
            .eq('id', id)
            .eq('user_id', org_id)
            .select()
            .single()
          if (error) return `Erro: ${error.message}`
          actionData = { type: 'event_updated', data }
          return `Evento atualizado: ${data.title}`
        },
      }),
      delete_event: tool({
        description: 'Remove um evento da agenda pelo id.',
        parameters: z.object({ id: z.string().uuid() }),
        execute: async ({ id }) => {
          const { error } = await sb
            .from('events')
            .delete()
            .eq('id', id)
            .eq('user_id', org_id)
          if (error) return `Erro: ${error.message}`
          actionData = { type: 'event_deleted', data: { id } }
          return `Evento removido.`
        },
      }),
      list_clients: tool({
        description: 'Lista clientes cadastradas. Opcionalmente busca por nome.',
        parameters: z.object({
          search: z.string().optional(),
          limit: z.number().optional(),
        }),
        execute: async (args) => {
          let q = sb
            .from('wedding_clients')
            .select('id, full_name, email, phone, cpf, wedding_date, status')
            .eq('user_id', org_id)
            .order('created_at', { ascending: false })
            .limit(args.limit ?? 20)
          if (args.search) q = q.ilike('full_name', `%${args.search}%`)
          const { data, error } = await q
          if (error) return `Erro: ${error.message}`
          return JSON.stringify(data)
        },
      }),
      create_client: tool({
        description: 'Cria nova cliente.',
        parameters: z.object({
          full_name: z.string(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          cpf: z.string().optional(),
          wedding_date: z.string().optional().describe('YYYY-MM-DD'),
        }),
        execute: async (args) => {
          const { data, error } = await sb
            .from('wedding_clients')
            .insert({ ...args, user_id: org_id })
            .select()
            .single()
          if (error) return `Erro: ${error.message}`
          actionData = { type: 'client_created', data }
          return `Cliente criada: ${data.full_name}`
        },
      }),
      update_client: tool({
        description: 'Atualiza dados de uma cliente.',
        parameters: z.object({
          id: z.string().uuid(),
          full_name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          wedding_date: z.string().optional(),
          status: z.string().optional(),
        }),
        execute: async (args) => {
          const { id, ...patch } = args
          const { data, error } = await sb
            .from('wedding_clients')
            .update(patch)
            .eq('id', id)
            .eq('user_id', org_id)
            .select()
            .single()
          if (error) return `Erro: ${error.message}`
          actionData = { type: 'client_updated', data }
          return `Cliente atualizada: ${data.full_name}`
        },
      }),
      list_projects: tool({
        description: 'Lista projetos/eventos em produção.',
        parameters: z.object({
          status: z.string().optional(),
          search: z.string().optional(),
          limit: z.number().optional(),
        }),
        execute: async (args) => {
          let q = sb
            .from('projects')
            .select(
              'id, name, event_date, status, total_value, client_id, location',
            )
            .eq('user_id', org_id)
            .order('event_date', { ascending: false, nullsFirst: false })
            .limit(args.limit ?? 20)
          if (args.status) q = q.eq('status', args.status)
          if (args.search) q = q.ilike('name', `%${args.search}%`)
          const { data, error } = await q
          if (error) return `Erro: ${error.message}`
          return JSON.stringify(data)
        },
      }),
      create_project: tool({
        description: 'Cria novo projeto.',
        parameters: z.object({
          name: z.string(),
          event_date: z.string().optional(),
          total_value: z.number().optional(),
          client_id: z.string().uuid().optional(),
          location: z.string().optional(),
          status: z.string().optional(),
          notes: z.string().optional(),
        }),
        execute: async (args) => {
          const { data, error } = await sb
            .from('projects')
            .insert({ ...args, user_id: org_id })
            .select()
            .single()
          if (error) return `Erro: ${error.message}`
          actionData = { type: 'project_created', data }
          return `Projeto criado: ${data.name}`
        },
      }),
      update_project: tool({
        description: 'Atualiza um projeto existente.',
        parameters: z.object({
          id: z.string().uuid(),
          name: z.string().optional(),
          event_date: z.string().optional(),
          total_value: z.number().optional(),
          status: z.string().optional(),
          notes: z.string().optional(),
        }),
        execute: async (args) => {
          const { id, ...patch } = args
          const { data, error } = await sb
            .from('projects')
            .update(patch)
            .eq('id', id)
            .eq('user_id', org_id)
            .select()
            .single()
          if (error) return `Erro: ${error.message}`
          actionData = { type: 'project_updated', data }
          return `Projeto atualizado: ${data.name}`
        },
      }),
      list_invoices: tool({
        description:
          'Lista faturas. Filtra por status (paid, pending, overdue).',
        parameters: z.object({
          status: z.string().optional(),
          limit: z.number().optional(),
        }),
        execute: async (args) => {
          let q = sb
            .from('invoices')
            .select(
              'id, amount, status, due_date, paid_at, invoice_number, client_id, project_id, created_at',
            )
            .eq('user_id', org_id)
            .order('created_at', { ascending: false })
            .limit(args.limit ?? 20)
          if (args.status) q = q.eq('status', args.status)
          const { data, error } = await q
          if (error) return `Erro: ${error.message}`
          return JSON.stringify(data)
        },
      }),
      get_dashboard_stats: tool({
        description:
          'Resumo financeiro e operacional: receita paga, pendente, eventos próximos, contagens. Usar dados reais.',
        parameters: z.object({
          period: z
            .enum(['month', 'year', 'all'])
            .optional()
            .describe('Padrão: month'),
        }),
        execute: async (args) => {
          const period = args.period ?? 'month'
          const now = new Date()
          let since: string | null = null
          if (period === 'month') {
            since = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          } else if (period === 'year') {
            since = new Date(now.getFullYear(), 0, 1).toISOString()
          }

          let invQ = sb
            .from('invoices')
            .select('amount, status, paid_at, created_at')
            .eq('user_id', org_id)
          if (since) invQ = invQ.gte('created_at', since)
          const { data: invoices, error: invErr } = await invQ
          if (invErr) return `Erro invoices: ${invErr.message}`

          const totals = (invoices ?? []).reduce(
            (acc, i) => {
              const amt = Number(i.amount) || 0
              acc.total += amt
              if (i.status === 'paid') acc.paid += amt
              else if (i.status === 'pending') acc.pending += amt
              else if (i.status === 'overdue') acc.overdue += amt
              return acc
            },
            { total: 0, paid: 0, pending: 0, overdue: 0 },
          )

          const today = new Date().toISOString().slice(0, 10)
          const end = new Date()
          end.setDate(end.getDate() + 30)
          const { count: eventsUpcoming } = await sb
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', org_id)
            .gte('event_date', today)
            .lte('event_date', end.toISOString().slice(0, 10))

          const { count: clientsTotal } = await sb
            .from('wedding_clients')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', org_id)

          const { count: projectsActive } = await sb
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', org_id)
            .in('status', ['active', 'in_progress', 'confirmed'])

          const stats = {
            period,
            revenue: totals,
            events_next_30d: eventsUpcoming ?? 0,
            clients_total: clientsTotal ?? 0,
            projects_active: projectsActive ?? 0,
          }
          actionData = { type: 'stats_shown', data: stats }
          return JSON.stringify(stats)
        },
      }),
      invite_assistant: tool({
        description: 'Envia convite por email para um novo assistente de equipe.',
        parameters: z.object({
          email: z.string().email(),
          name: z.string().optional(),
        }),
        execute: async (args) => {
          const { data: artist } = await sb
            .from('makeup_artists')
            .select('id')
            .eq('user_id', user_id)
            .single()
          if (!artist) return 'Erro: perfil de maquiadora não encontrado.'
          const { data, error } = await sb.rpc('create_assistant_invite', {
            p_makeup_artist_id: artist.id,
            p_assistant_email: args.email,
          })
          if (error) return `Erro: ${error.message}`
          if (data?.success) {
            actionData = {
              type: 'invite_sent',
              data: { email: args.email, link: data.invite_link },
            }
            return `Convite enviado! Link: ${data.invite_link}`
          }
          return data?.message ?? 'Erro desconhecido.'
        },
      }),
      send_reminder: tool({
        description: 'Gera link de WhatsApp para lembrar cliente de evento.',
        parameters: z.object({ client_name: z.string() }),
        execute: async ({ client_name }) => {
          const { data: clients } = await sb
            .from('wedding_clients')
            .select('full_name, phone')
            .eq('user_id', org_id)
            .ilike('full_name', `%${client_name}%`)
            .limit(1)
          const c = clients?.[0]
          if (!c || !c.phone) return 'Cliente não encontrada ou sem telefone.'
          const phone = c.phone.replace(/\D/g, '')
          const link = `https://wa.me/55${phone}?text=Oi%20${encodeURIComponent(c.full_name)},%20lembrete%20do%20nosso%20evento!`
          actionData = {
            type: 'reminder_generated',
            data: { link, client_name: c.full_name },
          }
          return `Link: ${link}`
        },
      }),
      generate_contract: tool({
        description:
          'Gera e salva contrato jurídico para um projeto existente. Busca projeto pelo nome.',
        parameters: z.object({
          project_name: z.string(),
        }),
        execute: async ({ project_name }) => {
          const { data: projects } = await sb
            .from('projects')
            .select('*, client:wedding_clients(*)')
            .ilike('name', `%${project_name}%`)
            .eq('user_id', org_id)
            .limit(1)
          const project = projects?.[0]
          if (!project) return 'Projeto não encontrado.'

          const prompt = `Gere contrato de prestação de serviços em HTML limpo (sem <html>, <head>, <body>). Contratante: ${project.client?.full_name ?? 'A definir'}. Serviço: ${project.name}. Data do evento: ${project.event_date ?? 'A definir'}. Valor: ${project.total_value ?? 'A negociar'}. Inclua: qualificação das partes, objeto, obrigações, valor, cancelamento, foro (Brasil).`
          const { text: html } = await generateText({ model, prompt })

          const { data: contract, error } = await sb
            .from('contracts')
            .insert({
              title: `Contrato - ${project.name}`,
              content: html,
              project_id: project.id,
              client_id: project.client?.id,
              user_id: org_id,
              status: 'draft',
            })
            .select()
            .single()
          if (error) return `Erro ao salvar: ${error.message}`
          actionData = { type: 'contract_generated', data: contract }
          return `Contrato gerado e salvo em Contratos.`
        },
      }),
    }

    const today = new Date().toISOString().slice(0, 10)
    const SYSTEM_PROMPT = `Você é a Lumi, IA do Khaos Kontrol (CRM para maquiadoras profissionais).

DATA DE HOJE: ${today}

CAPACIDADES (use as tools adequadas):
1. **Agenda**: list_events, create_event, update_event, delete_event
2. **CRM**: list_clients, create_client, update_client
3. **Projetos**: list_projects, create_project, update_project
4. **Financeiro**: list_invoices, get_dashboard_stats (dados reais do banco)
5. **Equipe**: invite_assistant
6. **Contratos**: generate_contract (cria e salva na aba Contratos)
7. **Relacionamento**: send_reminder (WhatsApp)

DIRETRIZES:
- Datas relativas (hoje, amanhã, próxima semana) → converta usando a data de hoje.
- Pedido vago → pergunte detalhes antes de executar ação destrutiva.
- Após executar tool, confirme em 1-2 frases o que foi feito.
- Valores em Real (R$). Responda em português direto, sem jargão.
- Nunca invente números — sempre chame get_dashboard_stats para stats.`

    const { text } = await generateText({
      model,
      system: SYSTEM_PROMPT,
      messages: (messages ?? []).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      tools,
      maxSteps: 5,
    })

    return json({ reply: text, action: actionData })
  } catch (error) {
    await logEdgeError('ai-assistant', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return json({ error: msg }, 500)
  }
})
