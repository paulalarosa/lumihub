// ⚡️ Edge Function: Gemini 2.0 Flash (Novo Padrão)
// 1. Usa Deno.serve (Estável no Supabase Edge Runtime)
/// <reference no-default-lib="true" />
/// <reference lib="deno.ns" />

// 2. Importa SDK Google (v0.21.0 como solicitado)
// @ts-ignore
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  // 3. Tratamento de Preflight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 4. Autenticação (Tenta ambas as chaves para garantir funcionamento)
    const apiKey =
      Deno.env.get('GOOGLE_API_KEY') ||
      Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY')
    if (!apiKey) {
      console.error('❌ Erro: API Key do Google não encontrada.')
      throw new Error('Configuração de API Key ausente no servidor.')
    }

    // 5. Parse Payload (IMPORTANTE: Mantém lógica do Frontend Atual)
    const body = (await req.json()) as {
      mode?: string
      actors?: {
        client_name?: string
        client_doc?: string
        contractor_name?: string
        contractor_doc?: string
      }
      terms?: {
        date?: string
        price?: string
        location?: string
        services?: string
      }
      current_text?: string
      instruction?: string
      prompt?: string
    }
    const { mode, actors, terms, current_text, instruction, prompt } = body

    console.log(
      `⚡️ Processando com Gemini 2.0 Flash: Mode=${mode || 'Prompt Direto'}`,
    )

    let finalPrompt = ''

    if (prompt) {
      finalPrompt = prompt // Se o frontend mandar prompt direto, usa.
    } else if (mode === 'ARCHITECT') {
      finalPrompt = `
                CONTEXTO:
                Você é uma Advogada Especialista em Contratos Brasileiros. 
                Sua tarefa é gerar um contrato completo em formato HTML limpo (sem tags html/body/doctype, apenas o conteúdo interno div/h1/etc).
                
                DADOS DO CONTRATO:
                CONTRATANTE: ${actors?.client_name || 'Cliente'} (CPF: ${actors?.client_doc || '...'})
                CONTRATADA: ${actors?.contractor_name || 'Contratada'} (CPF: ${actors?.contractor_doc || '...'})
                DATA: ${terms?.date || 'A Definir'}
                VALOR: ${terms?.price || 'A Combinar'}
                LOCAL: ${terms?.location || 'A Definir'}
                SERVIÇOS: ${terms?.services || 'Assessoria Completa'}
                
                ESTRUTURA:
                1. Qualificação das partes
                2. Objeto do contrato
                3. Obrigações (Contratada e Contratante)
                4. Preço e Pagamento
                5. Cancelamento e Multas
                6. Foro
                
                SAÍDA:
                Retorne APENAS o código HTML do contrato.
            `
    } else if (mode === 'EDITOR') {
      finalPrompt = `
                CONTEXTO:
                Você é uma assistente editorial jurídica.
                
                TAREFA:
                Edite o texto abaixo conforme a instrução. Mantenha a formatação HTML original.
                
                TEXTO ORIGINAL:
                ${current_text}
                
                INSTRUÇÃO:
                ${instruction}
                
                SAÍDA:
                Retorne APENAS o HTML atualizado.
            `
    } else {
      finalPrompt = 'Escreva um contrato genérico de prestação de serviços.'
    }

    // 6. Chama o Gemini (Modelo: gemini-2.0-flash)
    // INFO: Gemini 1.5 parece ter sido descontinuado/renomeado em Jan 2025.
    // Gemini 2.0 Flash é o novo padrão rápido.
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent(finalPrompt)
    const response = await result.response
    const text = response.text()

    if (!text) throw new Error('Gemini retornou resposta vazia.')

    console.log('✅ Sucesso! Texto gerado.')

    // 7. Retorna Sucesso
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('🚨 Erro na Edge Function:', error)

    const errorMsg = error instanceof Error ? error.message : String(error)

    return new Response(
      JSON.stringify({ error: `Function Error: ${errorMsg}` }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
