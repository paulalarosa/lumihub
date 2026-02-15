import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.19.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const {
            messages,
            user_id,
            api_key,
            provider = 'gemini',
            model = 'gemini-2.0-flash-exp',
        } = await req.json();

        const apiKey = api_key || Deno.env.get("GEMINI_API_KEY");

        if (!apiKey) {
            throw new Error("API key não fornecida. Por favor, configure sua chave nas configurações de IA.");
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const tools = [
            {
                functionDeclarations: [
                    {
                        name: "get_upcoming_events",
                        description: "Lista eventos futuros da agenda da usuária",
                        parameters: {
                            type: "object",
                            properties: {
                                days_ahead: {
                                    type: "number",
                                    description: "Quantos dias no futuro buscar (padrão: 7)",
                                },
                            },
                        },
                    },
                    {
                        name: "get_client_info",
                        description: "Busca informações de um cliente específico",
                        parameters: {
                            type: "object",
                            properties: {
                                client_name: {
                                    type: "string",
                                    description: "Nome do cliente",
                                },
                            },
                            required: ["client_name"],
                        },
                    },
                    {
                        name: "create_event",
                        description: "Cria um novo evento na agenda",
                        parameters: {
                            type: "object",
                            properties: {
                                title: { type: "string", description: "Título do evento" },
                                date: { type: "string", description: "Data (YYYY-MM-DD)" },
                                time: { type: "string", description: "Horário (HH:MM)" },
                                client_name: { type: "string", description: "Nome da cliente" },
                                event_type: {
                                    type: "string",
                                    enum: ["wedding", "social", "test"],
                                    description: "Tipo de evento",
                                },
                            },
                            required: ["title", "date", "time"],
                        },
                    },
                    {
                        name: "get_dashboard_stats",
                        description: "Retorna estatísticas do dashboard (faturamento, eventos, etc)",
                        parameters: {
                            type: "object",
                            properties: {
                                period: {
                                    type: "string",
                                    enum: ["week", "month", "year"],
                                    description: "Período das estatísticas",
                                },
                            },
                        },
                    },
                    {
                        name: "create_canvas",
                        description: "Cria um documento/artifact para trabalhar em paralelo (contratos, roteiros, planos)",
                        parameters: {
                            type: "object",
                            properties: {
                                title: { type: "string", description: "Título do documento" },
                                content: { type: "string", description: "Conteúdo inicial em Markdown" },
                                type: {
                                    type: "string",
                                    enum: ["contract", "script", "markdown", "html"],
                                },
                            },
                            required: ["title", "content"],
                        },
                    },
                ],
            },
        ];

        const systemPrompt = `Você é Khaos AI, a assistente de alta performance do Khaos Kontrol.

PERSONALIDADE:
- Especialista em gestão de negócios para profissionais de eventos.
- Proativa, elegante e eficiente.
- Linguagem profissional e direta.

WIDGETS DINÂMICOS:
Quando relevante, você pode gerar widgets interativos:
- Dashboard stats → use widget "stats_card"
- Lista de eventos → use widget "events_table"
- Detalhes de cliente → use widget "client_card"

CANVAS/ARTIFACTS:
Para documentos longos (contratos, roteiros), use a tool "create_canvas".

EXEMPLO DE RESPOSTA COM WIDGET:
User: "Como está meu mês?"
Você: "📊 Analisando seu desempenho mensal:
<widget type="stats_card" data='{"revenue": 4500, "events": 12, "clients": 8}' />
Seu faturamento atingiu R$ 4.500 em 12 eventos confirmados!"`;

        const aiModel = genAI.getGenerativeModel({
            model,
            tools,
        });

        const chat = aiModel.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Protocolo Khaos iniciado. Como posso otimizar seu dia?" }],
                },
                ...messages.slice(0, -1).map((msg: any) => ({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: msg.content }],
                })),
            ],
        });

        const lastMessage = messages[messages.length - 1];
        let result = await chat.sendMessage(lastMessage.content);

        let functionCallIterations = 0;
        while (result.response.functionCalls() && functionCallIterations < 5) {
            functionCallIterations++;
            const functionCalls = result.response.functionCalls();

            const functionResponses = await Promise.all(
                functionCalls.map(async (call: any) => {
                    const functionResult = await executeFunction(call, user_id, supabaseClient);
                    return {
                        functionResponse: {
                            name: call.name,
                            response: functionResult,
                        },
                    };
                })
            );

            result = await chat.sendMessage(functionResponses);
        }

        const responseText = result.response.text();
        const widgets = extractWidgets(responseText);

        return new Response(
            JSON.stringify({
                content: responseText,
                widgets,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("AI Chat error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

async function executeFunction(call: any, userId: string, supabase: any) {
    const { name, args } = call;

    try {
        switch (name) {
            case "get_upcoming_events": {
                const daysAhead = args.days_ahead || 7;
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + daysAhead);

                const { data, error } = await supabase
                    .from("calendar_events")
                    .select("*, client:makeup_artists(*)") // Adjust relation if needed
                    .eq("user_id", userId)
                    .gte("start_time", new Date().toISOString())
                    .lte("start_time", futureDate.toISOString())
                    .order("start_time");

                if (error) throw error;
                return { events: data };
            }

            case "get_client_info": {
                const { data, error } = await supabase
                    .from("wedding_clients")
                    .select("*")
                    .eq("user_id", userId)
                    .ilike("name", `%${args.client_name}%`)
                    .limit(1)
                    .single();

                if (error) throw error;
                return data;
            }

            case "create_event": {
                const { data, error } = await supabase
                    .from("calendar_events")
                    .insert({
                        user_id: userId,
                        title: args.title,
                        start_time: `${args.date}T${args.time}:00Z`,
                        event_type: args.event_type || "social",
                    })
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, event: data };
            }

            case "get_dashboard_stats": {
                // Mocking stats for now based on historical data if available
                return {
                    revenue: 15400,
                    events: 8,
                    clients: 12
                };
            }

            case "create_canvas": {
                return {
                    action: "create_canvas",
                    title: args.title,
                    content: args.content,
                    type: args.type || "markdown",
                };
            }

            default:
                return { error: "Function not found" };
        }
    } catch (error: any) {
        return { error: error.message };
    }
}

function extractWidgets(text: string) {
    const widgetRegex = /<widget\s+type="([^"]+)"\s+data='([^']+)'\s*\/>/g;
    const widgets = [];
    let match;

    while ((match = widgetRegex.exec(text)) !== null) {
        try {
            widgets.push({
                id: crypto.randomUUID(),
                type: match[1],
                data: JSON.parse(match[2]),
            });
        } catch (e) {
            console.error("Widget parse error:", e);
        }
    }

    return widgets;
}
