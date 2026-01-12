import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

const SYSTEM_PROMPT = `Você é uma assistente de IA especializada em gerenciar compromissos e projetos para profissionais de beleza (maquiadores, cabeleireiros, etc).

Você pode ajudar os usuários com:
1. **Eventos/Agenda**: Criar, listar, atualizar e excluir eventos
2. **Projetos**: Criar, listar, atualizar e excluir projetos
3. **Clientes**: Listar e consultar informações de clientes
4. **Tarefas**: Gerenciar tarefas de projetos

IMPORTANTE:
- Sempre seja cordial e profissional
- Use linguagem natural em português brasileiro
- Quando criar eventos, confirme os detalhes com o usuário
- Para datas, aceite formatos como "amanhã", "próxima segunda", "15 de janeiro", etc
- Sempre informe ao usuário o que você fez após executar uma ação
- Se faltar informação essencial (como título ou data para evento), pergunte ao usuário

Você tem acesso às seguintes ferramentas para manipular dados:
- list_events: Lista eventos da agenda
- create_event: Cria um novo evento
- update_event: Atualiza um evento existente
- delete_event: Exclui um evento
- list_projects: Lista projetos
- create_project: Cria um novo projeto
- update_project: Atualiza um projeto
- delete_project: Exclui um projeto
- list_clients: Lista clientes
- list_tasks: Lista tarefas de um projeto`;

const tools = [
  {
    type: "function",
    function: {
      name: "list_events",
      description: "Lista eventos da agenda do usuário. Pode filtrar por período.",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Data inicial no formato YYYY-MM-DD" },
          end_date: { type: "string", description: "Data final no formato YYYY-MM-DD" },
          limit: { type: "number", description: "Número máximo de eventos a retornar (padrão: 10)" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_event",
      description: "Cria um novo evento na agenda",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título do evento" },
          event_date: { type: "string", description: "Data do evento no formato YYYY-MM-DD" },
          description: { type: "string", description: "Descrição do evento" },
          start_time: { type: "string", description: "Horário de início (HH:MM)" },
          end_time: { type: "string", description: "Horário de término (HH:MM)" },
          location: { type: "string", description: "Local do evento" },
          address: { type: "string", description: "Endereço completo" },
          event_type: { type: "string", description: "Tipo do evento: noivas, ensaio, editorial, debutante, formatura, outro" },
          client_id: { type: "string", description: "ID do cliente associado" },
          project_id: { type: "string", description: "ID do projeto associado" }
        },
        required: ["title", "event_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_event",
      description: "Atualiza um evento existente",
      parameters: {
        type: "object",
        properties: {
          event_id: { type: "string", description: "ID do evento a atualizar" },
          title: { type: "string", description: "Novo título do evento" },
          event_date: { type: "string", description: "Nova data (YYYY-MM-DD)" },
          description: { type: "string", description: "Nova descrição" },
          start_time: { type: "string", description: "Novo horário de início (HH:MM)" },
          end_time: { type: "string", description: "Novo horário de término (HH:MM)" },
          location: { type: "string", description: "Novo local" },
          address: { type: "string", description: "Novo endereço" }
        },
        required: ["event_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_event",
      description: "Exclui um evento da agenda",
      parameters: {
        type: "object",
        properties: {
          event_id: { type: "string", description: "ID do evento a excluir" }
        },
        required: ["event_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_projects",
      description: "Lista projetos do usuário",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filtrar por status: active, completed, cancelled" },
          limit: { type: "number", description: "Número máximo de projetos (padrão: 10)" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Cria um novo projeto",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do projeto" },
          client_id: { type: "string", description: "ID do cliente associado" },
          event_date: { type: "string", description: "Data do evento principal (YYYY-MM-DD)" },
          event_type: { type: "string", description: "Tipo do evento" },
          event_location: { type: "string", description: "Local do evento" },
          notes: { type: "string", description: "Observações sobre o projeto" }
        },
        required: ["name", "client_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_project",
      description: "Atualiza um projeto existente",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "ID do projeto a atualizar" },
          name: { type: "string", description: "Novo nome" },
          status: { type: "string", description: "Novo status: active, completed, cancelled" },
          event_date: { type: "string", description: "Nova data do evento (YYYY-MM-DD)" },
          event_location: { type: "string", description: "Novo local" },
          notes: { type: "string", description: "Novas observações" }
        },
        required: ["project_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_project",
      description: "Exclui um projeto",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "ID do projeto a excluir" }
        },
        required: ["project_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_clients",
      description: "Lista clientes do usuário",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "Buscar cliente por nome" },
          limit: { type: "number", description: "Número máximo de clientes (padrão: 10)" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "Lista tarefas de um projeto",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "ID do projeto" },
          completed: { type: "boolean", description: "Filtrar por status de conclusão" }
        },
        required: ["project_id"]
      }
    }
  }
];

async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<string> {
  console.log(`Executing tool: ${toolName}`, args);

  try {
    switch (toolName) {
      case "list_events": {
        let query = supabaseClient
          .from("events")
          .select("id, title, event_date, start_time, end_time, location, event_type, description, client:clients(name), project:projects(name)")
          .eq("user_id", userId)
          .order("event_date", { ascending: true })
          .limit(args.limit as number || 10);

        if (args.start_date) {
          query = query.gte("event_date", args.start_date);
        }
        if (args.end_date) {
          query = query.lte("event_date", args.end_date);
        }

        const { data, error } = await query;
        if (error) throw error;
        return JSON.stringify({ success: true, events: data, count: data?.length || 0 });
      }

      case "create_event": {
        const eventData = {
          title: args.title as string,
          event_date: args.event_date as string,
          description: args.description as string || null,
          start_time: args.start_time as string || null,
          end_time: args.end_time as string || null,
          location: args.location as string || null,
          address: args.address as string || null,
          event_type: args.event_type as string || "outro",
          client_id: args.client_id as string || null,
          project_id: args.project_id as string || null,
          user_id: userId
        };

        const { data, error } = await supabaseClient
          .from("events")
          .insert(eventData)
          .select()
          .single();

        if (error) throw error;
        return JSON.stringify({ success: true, message: "Evento criado com sucesso!", event: data });
      }

      case "update_event": {
        const { event_id, ...updateData } = args;
        const filteredData = Object.fromEntries(
          Object.entries(updateData).filter(([_, v]) => v !== undefined)
        );

        const { data, error } = await supabaseClient
          .from("events")
          .update(filteredData)
          .eq("id", event_id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;
        return JSON.stringify({ success: true, message: "Evento atualizado com sucesso!", event: data });
      }

      case "delete_event": {
        const { error } = await supabaseClient
          .from("events")
          .delete()
          .eq("id", args.event_id)
          .eq("user_id", userId);

        if (error) throw error;
        return JSON.stringify({ success: true, message: "Evento excluído com sucesso!" });
      }

      case "list_projects": {
        let query = supabaseClient
          .from("projects")
          .select("id, name, status, event_date, event_type, event_location, client:clients(name)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(args.limit as number || 10);

        if (args.status) {
          query = query.eq("status", args.status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return JSON.stringify({ success: true, projects: data, count: data?.length || 0 });
      }

      case "create_project": {
        const projectData = {
          name: args.name as string,
          client_id: args.client_id as string,
          event_date: args.event_date as string || null,
          event_type: args.event_type as string || null,
          event_location: args.event_location as string || null,
          notes: args.notes as string || null,
          user_id: userId,
          status: "active"
        };

        const { data, error } = await supabaseClient
          .from("projects")
          .insert(projectData)
          .select()
          .single();

        if (error) throw error;
        return JSON.stringify({ success: true, message: "Projeto criado com sucesso!", project: data });
      }

      case "update_project": {
        const { project_id, ...updateData } = args;
        const filteredData = Object.fromEntries(
          Object.entries(updateData).filter(([_, v]) => v !== undefined)
        );

        const { data, error } = await supabaseClient
          .from("projects")
          .update(filteredData)
          .eq("id", project_id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;
        return JSON.stringify({ success: true, message: "Projeto atualizado com sucesso!", project: data });
      }

      case "delete_project": {
        const { error } = await supabaseClient
          .from("projects")
          .delete()
          .eq("id", args.project_id)
          .eq("user_id", userId);

        if (error) throw error;
        return JSON.stringify({ success: true, message: "Projeto excluído com sucesso!" });
      }

      case "list_clients": {
        let query = supabaseClient
          .from("clients")
          .select("id, name, email, phone, instagram")
          .eq("user_id", userId)
          .order("name")
          .limit(args.limit as number || 10);

        if (args.search) {
          query = query.ilike("name", `%${args.search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return JSON.stringify({ success: true, clients: data, count: data?.length || 0 });
      }

      case "list_tasks": {
        let query = supabaseClient
          .from("tasks")
          .select("id, title, description, due_date, is_completed")
          .eq("project_id", args.project_id)
          .eq("user_id", userId)
          .order("sort_order");

        if (args.completed !== undefined) {
          query = query.eq("is_completed", args.completed);
        }

        const { data, error } = await query;
        if (error) throw error;
        return JSON.stringify({ success: true, tasks: data, count: data?.length || 0 });
      }

      default:
        return JSON.stringify({ success: false, error: `Ferramenta desconhecida: ${toolName}` });
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

const body = await req.json();
    const messages = body?.messages as Message[] | undefined;

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Formato de mensagem inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit messages array size (max 50 messages)
    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "Limite de mensagens excedido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate and sanitize each message
    const sanitizedMessages = messages.slice(-50).map(msg => {
      // Ensure proper role
      const role = msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system' 
        ? msg.role 
        : 'user';
      
      // Limit content length (max 2000 chars per message)
      const content = typeof msg.content === 'string' 
        ? msg.content.slice(0, 2000) 
        : '';
      
      return { role, content };
    });

    // First API call with tools
    let response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...sanitizedMessages,
        ],
        tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Taxa de requisições excedida. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione mais créditos ao seu workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    let data = await response.json();
    let assistantMessage = data.choices[0].message;

    // Process tool calls if any
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults: Message[] = [];

      for (const toolCall of assistantMessage.tool_calls as ToolCall[]) {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await executeTool(toolCall.function.name, args, supabaseClient, user.id);
        
        toolResults.push({
          role: "assistant",
          content: JSON.stringify({
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            result
          })
        });
      }

      // Continue conversation with tool results
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...sanitizedMessages,
            assistantMessage,
            ...toolResults.map(tr => ({ role: "user" as const, content: `Resultado da ferramenta: ${tr.content}` }))
          ],
          tools,
          tool_choice: "auto",
        }),
      });

      if (!response.ok) {
        throw new Error("AI gateway error on tool result processing");
      }

      data = await response.json();
      assistantMessage = data.choices[0].message;
    }

    return new Response(JSON.stringify({ 
      content: assistantMessage.content,
      role: "assistant"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro interno do servidor" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
