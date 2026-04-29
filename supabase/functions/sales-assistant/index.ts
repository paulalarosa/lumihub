import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0'
import { consumePublicAiQuota, aiQuotaResponse } from '../_shared/ai-rate-limit.ts'

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

const SALES_TO_EMAIL =
  Deno.env.get('RESEND_TO') ?? 'khaoskontrol07@gmail.com'
const SALES_FROM_EMAIL =
  Deno.env.get('OFFICIAL_EMAIL_KHAOS') ??
  'Khaos Kontrol <noreply@khaoskontrol.com.br>'

const KNOWLEDGE_BASE = `KHAOS KONTROL — CRM para maquiadoras profissionais.

PLANOS (assinatura mensal, 14 dias grátis):
- Essencial: R$ 39,90/mês (anual R$ 31,92/mês — 20% off). Até 10 clientes, agenda + financeiro básico, contratos digitais.
- Profissional: R$ 89,90/mês (anual R$ 71,92/mês). Clientes ilimitados, analytics, portal da noiva personalizado, follow-up automático.
- Studio: R$ 149,90/mês (anual R$ 119,92/mês). Equipe + comissões automáticas, multi-usuário, IA operacional, suporte prioritário, API.

FEATURES PRINCIPAIS:
- Agenda integrada com Google Calendar
- Contratos com IA jurídica (geração, refino, parecer legal)
- Faturamento e cobrança (integração Stripe)
- Clientes com portal da noiva
- Pipeline de leads com scoring
- Equipe com permissões por assistente
- Microsite público com agendamento (/b/:slug)
- Notificações push + email transacional
- App PWA (instalável no celular)

DIFERENCIAIS:
- Design Industrial Noir exclusivo (não tem igual no mercado)
- IA especializada no setor de beleza/eventos
- Feito por brasileiras, em pt-BR
- Dados no Brasil, conformidade LGPD

PARA QUEM:
- Maquiadoras profissionais autônomas ou com equipe
- Foco em noivas, debutantes, eventos sociais
- Que querem profissionalizar a gestão e escalar

SUPORTE:
- Email: khaoskontrol07@gmail.com
- WhatsApp: +55 21 98360-4870
- Trial de 14 dias sem cartão

REGRAS DE CONVERSA:
1. Seja direta, calorosa e consultiva — como uma atendente de boutique.
2. NUNCA invente informação que não está nesta base. Se não souber, diga e ofereça encaminhar pra humana via WhatsApp.
3. Se a pessoa demonstrar interesse real (pedir proposta, agendar demo, perguntar preço específico pra caso dela), chame a tool capture_lead.
4. Se perguntarem "qual plano é melhor pra mim", faça 1-2 perguntas (tamanho da equipe, volume de clientes) e recomende.
5. Resposta curta — 2-4 frases. Use quebras de linha.
6. NÃO use emojis excessivamente — no máximo 1 emoji por resposta.
7. Convide pro trial ou pro WhatsApp quando fizer sentido.`

type Message = { role: 'user' | 'assistant' | 'model'; content: string }

const notifyLead = async (
  lead: { name: string; email: string; phone?: string; interest?: string; message?: string },
) => {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return { sent: false, reason: 'no RESEND_API_KEY' }
  try {
    const resend = new Resend(resendKey)
    await resend.emails.send({
      from: SALES_FROM_EMAIL,
      to: SALES_TO_EMAIL,
      subject: `[LEAD] ${lead.name} — ${lead.email}`,
      html: `
        <h2>Novo lead via chat da landing</h2>
        <p><b>Nome:</b> ${lead.name}</p>
        <p><b>Email:</b> ${lead.email}</p>
        ${lead.phone ? `<p><b>Telefone:</b> ${lead.phone}</p>` : ''}
        ${lead.interest ? `<p><b>Interesse:</b> ${lead.interest}</p>` : ''}
        ${lead.message ? `<p><b>Mensagem:</b><br>${lead.message}</p>` : ''}
        <hr>
        <p style="color:#888;font-size:12px">Capturado em ${new Date().toISOString()} pelo KONTROL_PUBLIC_TERMINAL.</p>
      `,
    })
    return { sent: true }
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : 'unknown' }
  }
}

const logLead = async (
  lead: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
) => {
  try {
    await supabase.from('system_logs').insert({
      action: 'public_chat_lead',
      category: 'sales',
      metadata: lead,
      severity: 'info',
    })
  } catch (_) {
    // swallow — logs são secundários
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    // Rate limit DB-backed por IP — protege custo Gemini contra loops/bots.
    // 50 req/hora por IP (cap horário, alinhado com try_consume_ai_quota).
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const quota = await consumePublicAiQuota(
      `ip:${clientIp}`,
      'sales-assistant',
      50,
    )
    if (!quota.allowed) return aiQuotaResponse(quota)

    const apiKey =
      Deno.env.get('GOOGLE_API_KEY') ||
      Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY')
    if (!apiKey) return json({ error: 'Missing AI key' }, 500)

    const { messages } = (await req.json()) as { messages?: Message[] }
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'Missing messages' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: KNOWLEDGE_BASE,
      tools: [
        {
          functionDeclarations: [
            {
              name: 'capture_lead',
              description:
                'Registra um lead interessado. Use quando a pessoa fornecer dados de contato ou pedir proposta/demo.',
              parameters: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  interest: {
                    type: 'string',
                    description: 'Plano ou feature que interessou',
                  },
                  message: { type: 'string' },
                },
                required: ['name', 'email'],
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 512,
      },
    })

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
    const lastUserMessage = messages[messages.length - 1].content

    const chat = model.startChat({ history })
    let result = await chat.sendMessage(lastUserMessage)
    let leadCaptured: Record<string, unknown> | null = null
    let hops = 0

    while (result.response.functionCalls() && hops < 3) {
      hops++
      const calls = result.response.functionCalls() ?? []
      const responses = []
      for (const call of calls) {
        if (call.name === 'capture_lead') {
          const lead = call.args as {
            name: string
            email: string
            phone?: string
            interest?: string
            message?: string
          }
          const emailRes = await notifyLead(lead)
          await logLead({ ...lead, emailRes }, supabase)
          leadCaptured = lead
          responses.push({
            functionResponse: {
              name: 'capture_lead',
              response: { success: true, sent: emailRes.sent },
            },
          })
        } else {
          responses.push({
            functionResponse: {
              name: call.name,
              response: { error: 'unknown tool' },
            },
          })
        }
      }
      result = await chat.sendMessage(responses)
    }

    const text = result.response.text()

    return json({
      reply: text,
      lead_captured: leadCaptured !== null,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return json({ error: msg }, 500)
  }
})
