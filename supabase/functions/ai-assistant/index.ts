import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateText, tool } from 'npm:ai'
import { createGoogleGenerativeAI } from 'npm:@ai-sdk/google'
import { createOpenAI } from 'npm:@ai-sdk/openai'
import { z } from 'npm:zod'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-ai-provider, x-ai-key, x-ai-model',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, user_id, conversation_id } = await req.json()

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
      throw new Error(`Unsupported provider: ${providerType}`)
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    let actionData = null

    const tools = {
      list_events: tool({
        description:
          'Lista eventos da agenda. Pode filtrar por período (week, month) ou datas específicas.',
        parameters: z.object({
          period: z.enum(['week', 'month', 'today', 'tomorrow']).optional(),
          start_date: z.string().optional(),
          end_date: z.string().optional(),
        }),
        execute: async (args) => {
          let query = supabaseClient
            .from('events')
            .select('*')
            .eq('user_id', user_id)
            .limit(10)
          if (args.period === 'today') {
            const today = new Date().toISOString().split('T')[0]
            query = query
              .gte('event_date', today)
              .lte('event_date', today + ' 23:59:59')
          }
          const { data, error } = await query
          return error ? `Erro: ${error.message}` : JSON.stringify(data)
        },
      }),
      create_event: tool({
        description: 'Cria evento/compromisso na agenda.',
        parameters: z.object({
          title: z.string(),
          start_time: z.string().describe('ISO 8601'),
          end_time: z.string().describe('ISO 8601'),
          description: z.string().optional(),
        }),
        execute: async (args) => {
          const { data, error } = await supabaseClient
            .from('events')
            .insert({
              title: args.title,
              event_date: args.start_time,
              start_time: args.start_time,
              end_time: args.end_time,
              description: args.description,
              user_id,
            })
            .select()

          if (!error && data) {
            actionData = { type: 'event_created', data: data[0] }
            return `Evento criado: ${data[0].title}`
          }
          return error
            ? `Erro: ${error.message}`
            : 'Erro desconhecido ao criar evento.'
        },
      }),
      create_client: tool({
        description: 'Cria um novo cliente no sistema CRM.',
        parameters: z.object({
          name: z.string(),
          email: z.string().email(),
          phone: z.string().optional(),
          cpf: z.string().optional(),
        }),
        execute: async (args) => {
          const { data, error } = await supabaseClient
            .from('wedding_clients')
            .insert({
              full_name: args.name,
              email: args.email,
              phone: args.phone,
              cpf: args.cpf,
              user_id,
            })
            .select()

          if (!error && data) {
            actionData = { type: 'client_created', data: data[0] }
            return `Cliente criado com ID: ${data[0].id}`
          }
          return error ? `Erro: ${error.message}` : 'Erro ao criar cliente.'
        },
      }),
      invite_assistant: tool({
        description:
          'Envia convite por email para um novo assistente de equipe.',
        parameters: z.object({
          email: z.string().email(),
          name: z.string().optional(),
        }),
        execute: async (args) => {
          const { data: artist } = await supabaseClient
            .from('makeup_artists')
            .select('id')
            .eq('user_id', user_id)
            .single()
          if (artist) {
            const { data, error } = await supabaseClient.rpc(
              'create_assistant_invite',
              {
                p_makeup_artist_id: artist.id,
                p_assistant_email: args.email,
              },
            )
            if (!error && data?.success) {
              actionData = {
                type: 'invite_sent',
                data: { email: args.email, link: data.invite_link },
              }
              return `Convite enviado! Link: ${data.invite_link}`
            }
            return error ? `Erro: ${error.message}` : data.message
          }
          return 'Erro: Perfil de maquiadora não encontrado.'
        },
      }),
      generate_contract: tool({
        description:
          'Gera e salva um contrato jurídico para um projeto existente.',
        parameters: z.object({
          project_title: z
            .string()
            .describe('Nome/Título do projeto para buscar'),
        }),
        execute: async (args) => {
          const { data: projects } = await supabaseClient
            .from('projects')
            .select('*, client:wedding_clients(*)')
            .ilike('title', `%${args.project_title}%`)
            .eq('user_id', user_id)

          if (!projects || projects.length === 0)
            return 'Projeto não encontrado com esse nome.'

          const project = projects[0]
          const contractPrompt = `Gere um contrato de prestação de serviços para: Contratante ${project.client?.full_name}, Evento ${project.title} em ${project.event_date}. Retorne apenas HTML.`

          const { text: contractText } = await generateText({
            model,
            prompt: contractPrompt,
          })

          const { data: contractData, error } = await supabaseClient
            .from('contracts')
            .insert({
              title: `Contrato - ${project.title}`,
              content: contractText,
              project_id: project.id,
              client_id: project.client?.id,
              user_id,
              status: 'draft',
            })
            .select()

          if (!error && contractData) {
            actionData = { type: 'contract_generated', data: contractData[0] }
            return 'Contrato gerado e salvo na aba Contratos.'
          }
          return error
            ? `Erro ao salvar: ${error.message}`
            : 'Erro ao gerar contrato.'
        },
      }),
      get_dashboard_stats: tool({
        description:
          'Obtém estatísticas financeiras e de eventos da dashboard.',
        parameters: z.object({
          period: z
            .enum(['month', 'year'])
            .optional()
            .describe('Período para análise'),
        }),
        execute: async (args) => {
          const { count } = await supabaseClient
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id)
          actionData = {
            type: 'stats_shown',
            data: { count, revenue: 5000, period: args.period },
          }
          return `Total de projetos: ${count}. Receita simulada: R$ 5.000,00 (Exemplo).`
        },
      }),
      send_reminder: tool({
        description: 'Gera link de WhatsApp para lembrar cliente de um evento.',
        parameters: z.object({
          client_name: z.string(),
        }),
        execute: async (args) => {
          const { data: clients } = await supabaseClient
            .from('wedding_clients')
            .select('*')
            .ilike('full_name', `%${args.client_name}%`)
            .eq('user_id', user_id)
          if (clients && clients.length > 0) {
            const client = clients[0]
            const link = `https://wa.me/55${client.phone?.replace(/\D/g, '')}?text=Oi%20${client.full_name},%20lembrete%20do%20nosso%20evento!`
            actionData = {
              type: 'reminder_generated',
              data: { link, client_name: client.full_name },
            }
            return `Link gerado: ${link}`
          }
          return 'Cliente não encontrado.'
        },
      }),
    }

    const SYSTEM_PROMPT = `Você é a Lumi, IA do Khaos Kontrol.
CAPACIDADES:
1. **Agenda**: Criar/listar eventos
2. **CRM**: Criar clientes ("Crie a cliente Ana...")
3. **Equipe**: Convidar assistentes ("Convide julia@email.com")
4. **Jurídico**: Gerar contratos ("Gere contrato para o casamento da Maria")
5. **Financeiro**: Ver estatísticas ("Quanto faturei este mês?")

DIRETRIZES:
- Se o usuário pedir algo vago (ex: "Crie evento"), pergunte os detalhes.
- Responda de forma curta e prestativa. Use emojis moderadamente.`

    const { text } = await generateText({
      model,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      tools,
      maxSteps: 5,
    })

    return new Response(JSON.stringify({ reply: text, action: actionData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
