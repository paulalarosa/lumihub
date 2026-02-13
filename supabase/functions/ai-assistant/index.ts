
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

// Setup Gemini API
const genAI = new GoogleGenerativeAI(Deno.env.get("GOOGLE_API_KEY") || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// RAG Helper
async function getRelevantDocs(query: string, supabaseClient: any) {
  try {
    const embeddingResult = await embeddingModel.embedContent(query);
    const queryEmbedding = embeddingResult.embedding.values;

    const { data, error } = await supabaseClient.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 3,
    });

    if (error) return '';
    if (!data || data.length === 0) return '';

    return data.map((doc: any) => `
[DOCUMENTO: ${doc.title}]
${doc.content}
`).join('\n\n');
  } catch (err) {
    console.error('RAG Exception:', err);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, user_id, conversation_id } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const lastUserMessage = messages.map(m => m).reverse().find(m => m.role === 'user')?.content || '';

    let knowledgeContext = '';
    if (lastUserMessage) {
      knowledgeContext = await getRelevantDocs(lastUserMessage, supabaseClient);
    }

    const tools = [
      {
        function_declarations: [
          {
            name: "list_events",
            description: "Lista eventos da agenda. Pode filtrar por período (week, month) ou datas específicas.",
            parameters: {
              type: "OBJECT",
              properties: {
                period: { type: "STRING", enum: ["week", "month", "today", "tomorrow"] },
                start_date: { type: "STRING" },
                end_date: { type: "STRING" }
              }
            }
          },
          {
            name: "create_event",
            description: "Cria evento/compromisso na agenda.",
            parameters: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                start_time: { type: "STRING", description: "ISO 8601" },
                end_time: { type: "STRING", description: "ISO 8601" },
                description: { type: "STRING" }
              },
              required: ["title", "start_time", "end_time"]
            }
          },
          {
            name: "create_client",
            description: "Cria um novo cliente no sistema CRM.",
            parameters: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                email: { type: "STRING" },
                phone: { type: "STRING" },
                cpf: { type: "STRING" }
              },
              required: ["name", "email"]
            }
          },
          {
            name: "invite_assistant",
            description: "Envia convite por email para um novo assistente de equipe.",
            parameters: {
              type: "OBJECT",
              properties: {
                email: { type: "STRING" },
                name: { type: "STRING" }
              },
              required: ["email"]
            }
          },
          {
            name: "generate_contract",
            description: "Gera e salva um contrato jurídico para um projeto existente.",
            parameters: {
              type: "OBJECT",
              properties: {
                project_title: { type: "STRING", description: "Nome/Título do projeto para buscar" }
              },
              required: ["project_title"]
            }
          },
          {
            name: "get_dashboard_stats",
            description: "Obtém estatísticas financeiras e de eventos da dashboard.",
            parameters: {
              type: "OBJECT",
              properties: {
                period: { type: "STRING", enum: ["month", "year"], description: "Período para análise" }
              }
            }
          },
          {
            name: "send_reminder",
            description: "Gera link de WhatsApp para lembrar cliente de um evento.",
            parameters: {
              type: "OBJECT",
              properties: {
                client_name: { type: "STRING" }
              },
              required: ["client_name"]
            }
          }
        ]
      }
    ];

    const SYSTEM_PROMPT = `Você é a Lumi, IA do Khaos Kontrol.

${knowledgeContext ? `DOCUMENTAÇÃO:\n${knowledgeContext}\n` : ''}

CAPACIDADES:
1. **Agenda**: Criar/listar eventos
2. **CRM**: Criar clientes ("Crie a cliente Ana...")
3. **Equipe**: Convidar assistentes ("Convide julia@email.com")
4. **Jurídico**: Gerar contratos ("Gere contrato para o casamento da Maria")
5. **Financeiro**: Ver estatísticas ("Quanto faturei este mês?")

DIRETRIZES:
- Se o usuário pedir algo vago (ex: "Crie evento"), pergunte os detalhes.
- Para "Gere contrato", primeiro precisamo achar o projeto. Pergunte o nome do projeto se não fornecido.
- Responda de forma curta e prestativa.
- Use emojis moderadamente.`;

    const chatSession = model.startChat({
      history: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Olá! Sou a Lumi. Como posso ajudar na gestão do seu negócio hoje?" }] },
        ...messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }))
      ],
      tools: tools,
    });

    const result = await chatSession.sendMessage(messages[messages.length - 1].content);
    const response = await result.response;
    let text = response.text();
    const functionCalls = response.functionCalls();

    let actionData = null; // Store metadata for frontend

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const fn = call.name;
      const args = call.args;
      let output = "";

      console.log(`Executing tool: ${fn}`, args);

      if (fn === 'list_events') {
        let query = supabaseClient.from('events').select('*').eq('user_id', user_id).limit(10);
        if (args.period === 'today') {
          const today = new Date().toISOString().split('T')[0];
          query = query.gte('event_date', today).lte('event_date', today + ' 23:59:59');
        }
        const { data, error } = await query;
        output = error ? `Erro: ${error.message}` : JSON.stringify(data);

      } else if (fn === 'create_event') {
        const { data, error } = await supabaseClient.from('events').insert({
          title: args.title,
          event_date: args.start_time,
          start_time: args.start_time,
          end_time: args.end_time,
          description: args.description,
          user_id
        }).select();
        output = error ? `Erro: ${error.message}` : `Evento criado: ${data[0].title}`;
        if (data) actionData = { type: 'event_created', data: data[0] };

      } else if (fn === 'create_client') {
        const { data, error } = await supabaseClient.from('wedding_clients').insert({
          full_name: args.name,
          email: args.email,
          phone: args.phone,
          cpf: args.cpf,
          user_id
        }).select();
        output = error ? `Erro: ${error.message}` : `Cliente criado com ID: ${data[0].id}`;
        if (data) actionData = { type: 'client_created', data: data[0] };

      } else if (fn === 'invite_assistant') {
        const { data: artist } = await supabaseClient.from('makeup_artists').select('id').eq('user_id', user_id).single();
        if (artist) {
          const { data, error } = await supabaseClient.rpc('create_assistant_invite', {
            p_makeup_artist_id: artist.id,
            p_assistant_email: args.email
          });
          output = error ? `Erro: ${error.message}` : (data.success ? `Convite enviado! Link: ${data.invite_link}` : data.message);
          if (data?.success) actionData = { type: 'invite_sent', data: { email: args.email, link: data.invite_link } };
        } else {
          output = "Erro: Perfil de maquiadora não encontrado.";
        }

      } else if (fn === 'generate_contract') {
        const { data: projects } = await supabaseClient.from('projects').select('*, client:wedding_clients(*)').ilike('title', `%${args.project_title}%`).eq('user_id', user_id);

        if (!projects || projects.length === 0) {
          output = "Projeto não encontrado com esse nome.";
        } else {
          const project = projects[0];
          const contractPrompt = `Gere um contrato de prestação de serviços para: Contratante ${project.client?.full_name}, Evento ${project.title} em ${project.event_date}. Retorne apenas HTML.`;
          const contractResult = await model.generateContent(contractPrompt);
          const contractText = contractResult.response.text();

          const { data: contractData, error } = await supabaseClient.from('contracts').insert({
            title: `Contrato - ${project.title}`,
            content: contractText,
            project_id: project.id,
            client_id: project.client?.id,
            user_id,
            status: 'draft'
          }).select();
          output = error ? `Erro ao salvar: ${error.message}` : "Contrato gerado e salvo na aba Contratos.";
          if (contractData) actionData = { type: 'contract_generated', data: contractData[0] };
        }

      } else if (fn === 'get_dashboard_stats') {
        const { count } = await supabaseClient.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user_id);
        output = `Total de projetos: ${count}. Receita simulada: R$ 5.000,00 (Exemplo).`;
        actionData = { type: 'stats_shown', data: { count, revenue: 5000, period: args.period } };

      } else if (fn === 'send_reminder') {
        const { data: clients } = await supabaseClient.from('wedding_clients').select('*').ilike('full_name', `%${args.client_name}%`).eq('user_id', user_id);
        if (clients && clients.length > 0) {
          const client = clients[0];
          const link = `https://wa.me/55${client.phone?.replace(/\D/g, '')}?text=Oi%20${client.full_name},%20lembrete%20do%20nosso%20evento!`;
          output = `Link gerado: ${link}`;
          actionData = { type: 'reminder_generated', data: { link, client_name: client.full_name } };
        } else {
          output = "Cliente não encontrado.";
        }
      }

      const result2 = await chatSession.sendMessage([
        { functionResponse: { name: fn, response: { result: output } } }
      ]);
      text = result2.response.text();
    }

    return new Response(JSON.stringify({ reply: text, action: actionData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
