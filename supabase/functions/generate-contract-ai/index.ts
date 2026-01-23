import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // The frontend sends the payload directly in the body
        const body = await req.json();
        const { mode, actors, terms, current_text, instruction } = body;

        let systemPrompt = "";
        let userPrompt = "";

        if (mode === 'ARCHITECT') {
            systemPrompt = "Você é uma Advogada Especialista. Gere um contrato HTML/Markdown limpo. NUNCA invente dados. Use ESTRITAMENTE os dados fornecidos.";
            userPrompt = `
               CONTRATADA: ${actors.contractor_name} (CPF: ${actors.contractor_doc})
               CONTRATANTE: ${actors.client_name} (CPF: ${actors.client_doc})
               DATA: ${terms.date}
               VALOR: ${terms.price}
               
               Crie cláusulas robustas de: Objeto, Obrigações, Atraso (Max 15min), Alergias e Cancelamento.
             `;
        }
        else if (mode === 'EDITOR') {
            systemPrompt = "Você é uma assistente editorial jurídica. Mantenha o formato original e altere APENAS o solicitado.";
            userPrompt = `TEXTO ATUAL: ${current_text}\n\nALTERAÇÃO SOLICITADA: ${instruction}`;
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.5,
            }),
        });

        const data = await response.json();
        const text = data.choices[0].message.content;

        return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
