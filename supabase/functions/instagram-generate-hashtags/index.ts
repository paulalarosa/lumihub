import { serve } from "std/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!);

serve(async (req) => {
    try {
        const { caption, category } = await req.json();

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `Você é especialista em marketing para maquiadoras no Instagram.

Com base nesta legenda de post: "${caption}"
Categoria: ${category || "makeup"}

Gere uma lista de 30 hashtags em português e inglês que:
- São relevantes para maquiagem profissional
- Misturam hashtags populares (alta concorrência) e nichadas (baixa concorrência)
- Incluem hashtags locais do Brasil
- Aumentam alcance e engajamento

Responda APENAS em JSON:
{
  "hashtags": ["#maquiagemprofissional", "#makeupbrasil", ...],
  "reasoning": "Explicação da estratégia"
}`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();
        const cleanJson = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const data = JSON.parse(cleanJson);

        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Generate hashtags error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
});
