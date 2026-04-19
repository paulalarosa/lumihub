import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const LAWYER_PERSONA = `Você é uma advogada brasileira especialista em contratos de prestação de serviços para o setor de beleza, maquiagem e eventos. Escreve em português jurídico formal brasileiro, com precisão técnica e linguagem direta.

PRINCÍPIOS:
- Fundamentação no Código Civil Brasileiro (Lei 10.406/2002), Código de Defesa do Consumidor (Lei 8.078/90) quando aplicável, Lei Geral de Proteção de Dados (Lei 13.709/2018) e Lei de Direitos Autorais (Lei 9.610/98).
- Sempre incluir cláusula penal (multa rescisória) proporcional e razoável — tipicamente 30% se rescisão com mais de 30 dias de antecedência, 50% entre 15-30 dias, 100% em menos de 15 dias ou no-show.
- Cláusula de uso de imagem para portfólio é essencial — deve ser destacada, não escondida.
- Conformidade com LGPD obrigatória quando há coleta de dados pessoais.
- Foro padrão: comarca da contratada, com renúncia a qualquer outro.
- NUNCA invente dados. Se faltar informação, use "[A PREENCHER]" em destaque.

FORMATO DE SAÍDA:
- HTML puro e limpo, SEM wrappers (<html>, <head>, <body>, <!DOCTYPE>).
- Use <h1> para título, <h2> para cláusulas, <p> para parágrafos, <strong> para termos-chave, <ol>/<ul> para listas.
- Numeração de cláusulas no formato "CLÁUSULA PRIMEIRA – OBJETO", "CLÁUSULA SEGUNDA – ...", etc.
- Sem emojis, sem markdown, sem caracteres decorativos.`

type Actors = {
  client_name?: string
  client_doc?: string
  client_rg?: string
  client_address?: string
  client_nationality?: string
  client_marital_status?: string
  contractor_name?: string
  contractor_doc?: string
  contractor_rg?: string
  contractor_address?: string
  contractor_nationality?: string
  contractor_marital_status?: string
}

type Terms = {
  event_date?: string
  event_time?: string
  price?: string
  payment_method?: string
  location?: string
  services?: string
  guests_count?: number
}

type Body = {
  mode?: 'GENERATE' | 'REFINE' | 'REVIEW' | 'CLAUSE' | 'ARCHITECT' | 'EDITOR'
  actors?: Actors
  terms?: Terms
  current_text?: string
  instruction?: string
  clause_topic?: string
  prompt?: string
}

const buildGeneratePrompt = (actors?: Actors, terms?: Terms) => `${LAWYER_PERSONA}

TAREFA: Gerar contrato completo de prestação de serviços de maquiagem/beleza profissional.

DADOS FORNECIDOS:
CONTRATADA (prestadora do serviço):
- Nome: ${actors?.contractor_name || '[A PREENCHER]'}
- CPF: ${actors?.contractor_doc || '[A PREENCHER]'}
- RG: ${actors?.contractor_rg || '[A PREENCHER]'}
- Nacionalidade: ${actors?.contractor_nationality || 'brasileira'}
- Estado civil: ${actors?.contractor_marital_status || '[A PREENCHER]'}
- Endereço: ${actors?.contractor_address || '[A PREENCHER]'}

CONTRATANTE (cliente):
- Nome: ${actors?.client_name || '[A PREENCHER]'}
- CPF: ${actors?.client_doc || '[A PREENCHER]'}
- RG: ${actors?.client_rg || '[A PREENCHER]'}
- Nacionalidade: ${actors?.client_nationality || 'brasileira'}
- Estado civil: ${actors?.client_marital_status || '[A PREENCHER]'}
- Endereço: ${actors?.client_address || '[A PREENCHER]'}

DETALHES DO EVENTO:
- Data: ${terms?.event_date || '[A PREENCHER]'}
- Horário: ${terms?.event_time || '[A PREENCHER]'}
- Local: ${terms?.location || '[A PREENCHER]'}
- Serviços contratados: ${terms?.services || '[A PREENCHER]'}
- Número de pessoas atendidas: ${terms?.guests_count ?? '[A PREENCHER]'}
- Valor total: ${terms?.price || '[A PREENCHER]'}
- Forma de pagamento: ${terms?.payment_method || '50% na assinatura, 50% no dia do evento'}

ESTRUTURA OBRIGATÓRIA (use EXATAMENTE nesta ordem):
<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MAQUIAGEM E BELEZA</h1>

<h2>QUALIFICAÇÃO DAS PARTES</h2>
Identifique CONTRATADA e CONTRATANTE com todos os dados acima.

<h2>CLÁUSULA PRIMEIRA – DO OBJETO</h2>
Descreva serviços específicos, incluindo maquiagem, penteado, deslocamento se aplicável.

<h2>CLÁUSULA SEGUNDA – DO LOCAL E DATA</h2>
Data, horário de início, local do atendimento.

<h2>CLÁUSULA TERCEIRA – DO VALOR E FORMA DE PAGAMENTO</h2>
Valor total, parcelamento, meio de pagamento, data de vencimento de cada parcela, multa por atraso (2%) e juros (1% ao mês) conforme CDC/CC.

<h2>CLÁUSULA QUARTA – DAS OBRIGAÇÕES DA CONTRATADA</h2>
Lista detalhada: pontualidade, materiais, higiene, profissionalismo.

<h2>CLÁUSULA QUINTA – DAS OBRIGAÇÕES DA CONTRATANTE</h2>
Informações prévias, estrutura mínima no local, pagamento, pessoa para teste se houver.

<h2>CLÁUSULA SEXTA – DO CANCELAMENTO E MULTA RESCISÓRIA</h2>
Tabela de multas:
- Rescisão com +30 dias de antecedência: devolução de 70% do sinal.
- Rescisão entre 15 e 30 dias: retenção integral do sinal.
- Rescisão com -15 dias ou no-show: valor integral devido.
Adiamento: até 1 (uma) remarcação sem ônus, sujeita à disponibilidade da CONTRATADA.

<h2>CLÁUSULA SÉTIMA – DO USO DE IMAGEM E DIREITOS AUTORAIS</h2>
Autorização para uso em portfólio, redes sociais e material publicitário da CONTRATADA, com base na Lei 9.610/98. A CONTRATANTE poderá vetar expressamente o uso público, por escrito, antes do evento.

<h2>CLÁUSULA OITAVA – DA PROTEÇÃO DE DADOS (LGPD)</h2>
Tratamento de dados pessoais conforme Lei 13.709/2018. Base legal: execução contratual. Finalidade: execução do contrato e cumprimento de obrigações. Prazo de retenção: 5 anos após término. Direitos do titular: acesso, correção, exclusão, portabilidade.

<h2>CLÁUSULA NONA – DO CASO FORTUITO E FORÇA MAIOR</h2>
Suspensão de obrigações em eventos imprevisíveis (art. 393 CC). Remarcação gratuita em caso de comprovado caso fortuito.

<h2>CLÁUSULA DÉCIMA – DAS DISPOSIÇÕES GERAIS</h2>
Alterações por aditivo escrito, sucessores, integralidade.

<h2>CLÁUSULA DÉCIMA PRIMEIRA – DO FORO</h2>
Foro da comarca da CONTRATADA.

<p>Local e data: [A PREENCHER]</p>
<p>_______________________________________</p>
<p>CONTRATADA</p>
<p>_______________________________________</p>
<p>CONTRATANTE</p>
<p>Testemunhas:</p>
<p>1) _______________________________  CPF: _______________</p>
<p>2) _______________________________  CPF: _______________</p>

Retorne APENAS o HTML do contrato. Sem explicações antes ou depois.`

const buildRefinePrompt = (currentText?: string, instruction?: string) => `${LAWYER_PERSONA}

TAREFA: Refinar o contrato abaixo conforme a instrução. Mantenha a estrutura HTML, a numeração das cláusulas e o rigor jurídico.

CONTRATO ATUAL:
${currentText ?? ''}

INSTRUÇÃO:
${instruction ?? 'melhorar a redação mantendo o conteúdo'}

REGRAS:
- Não invente dados faltantes — use "[A PREENCHER]".
- Preserve cláusulas não mencionadas na instrução.
- Se a instrução for ambígua ou sugerir algo juridicamente frágil, corrija e explique em comentário HTML (<!-- -->).

Retorne APENAS o HTML atualizado do contrato.`

const buildReviewPrompt = (currentText?: string) => `${LAWYER_PERSONA}

TAREFA: Revisar o contrato abaixo identificando problemas jurídicos, lacunas e riscos.

CONTRATO:
${currentText ?? ''}

FORMATO DE SAÍDA (HTML):
<h2>PARECER DA REVISÃO</h2>
<h3>1. Pontos críticos</h3>
<ul>problemas que podem invalidar ou fragilizar o contrato, com referência legal.</ul>
<h3>2. Lacunas e omissões</h3>
<ul>cláusulas ausentes ou incompletas.</ul>
<h3>3. Sugestões de melhoria</h3>
<ul>redação, proteção, LGPD, cláusula penal.</ul>
<h3>4. Avaliação geral</h3>
<p>parecer conclusivo em 2-3 frases.</p>

Retorne APENAS o HTML do parecer.`

const buildClausePrompt = (topic?: string, context?: string) => `${LAWYER_PERSONA}

TAREFA: Redigir UMA cláusula específica sobre: "${topic ?? 'a ser definido'}".

${context ? `CONTEXTO DO CONTRATO:\n${context}\n` : ''}

FORMATO:
<h2>CLÁUSULA – ${topic?.toUpperCase() ?? ''}</h2>
<p>redação da cláusula em no máximo 2 parágrafos.</p>

Retorne APENAS o HTML da cláusula.`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey =
      Deno.env.get('GOOGLE_API_KEY') ||
      Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY')
    if (!apiKey) return json({ error: 'Missing API key' }, 500)

    const body = (await req.json()) as Body
    const mode = body.mode

    let finalPrompt = ''
    if (body.prompt) {
      finalPrompt = body.prompt
    } else if (mode === 'GENERATE' || mode === 'ARCHITECT') {
      finalPrompt = buildGeneratePrompt(body.actors, body.terms)
    } else if (mode === 'REFINE' || mode === 'EDITOR') {
      finalPrompt = buildRefinePrompt(body.current_text, body.instruction)
    } else if (mode === 'REVIEW') {
      finalPrompt = buildReviewPrompt(body.current_text)
    } else if (mode === 'CLAUSE') {
      finalPrompt = buildClausePrompt(body.clause_topic, body.current_text)
    } else {
      return json({ error: 'Invalid mode' }, 400)
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 8192,
      },
    })

    const result = await model.generateContent(finalPrompt)
    const text = result.response.text()
    if (!text) return json({ error: 'Empty response' }, 502)

    const cleaned = text
      .replace(/^```(?:html)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()

    return json({ text: cleaned, mode })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return json({ error: `Function Error: ${msg}` }, 500)
  }
})
