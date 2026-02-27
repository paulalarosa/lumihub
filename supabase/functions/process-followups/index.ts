import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
    try {
        // Buscar follow-ups pendentes para enviar (próximos 5 minutos)
        const { data: followups, error } = await supabase
            .from("scheduled_followups")
            .select(`
        *,
        template:message_templates(*),
        project:projects(*, client:wedding_clients(*), artist:makeup_artists(*))
      `)
            .eq("status", "pending")
            .lte("scheduled_for", new Date(Date.now() + 5 * 60 * 1000).toISOString())
            .limit(50); // Processar 50 por vez

        if (error) throw error;

        console.log(`Processing ${followups?.length || 0} follow-ups`);

        for (const followup of followups || []) {
            try {
                // Substituir variáveis no template
                let message = followup.template.body;
                const variables = {
                    client_name: followup.project.client?.name || "Cliente",
                    event_date: new Date(followup.project.event_date).toLocaleDateString("pt-BR"),
                    event_time: followup.project.event_time || "a confirmar",
                    event_location: followup.project.event_location || "a confirmar",
                    event_type: followup.project.event_type || "evento",
                    makeup_artist_name: followup.project.artist?.name || "",
                    makeup_artist_phone: followup.project.artist?.phone || "",
                    review_link: `${Deno.env.get("APP_URL")}/review/${followup.project.id}`,
                    current_promotion: "20% OFF em makes para o próximo mês! 🎉",
                };

                // Replace variables
                Object.entries(variables).forEach(([key, value]) => {
                    message = message.replace(new RegExp(`{${key}}`, "g"), value);
                });

                // Enviar baseado no canal
                if (followup.template.channel === "whatsapp") {
                    await sendWhatsApp(
                        followup.project.client?.phone,
                        message
                    );
                } else if (followup.template.channel === "email") {
                    await sendEmail(
                        followup.project.client?.email,
                        followup.template.subject,
                        message
                    );
                }

                // Marcar como enviado
                await supabase
                    .from("scheduled_followups")
                    .update({
                        status: "sent",
                        sent_at: new Date().toISOString(),
                    })
                    .eq("id", followup.id);

                console.log(`✅ Sent followup ${followup.id}`);
            } catch (error: any) {
                // Marcar como falho
                await supabase
                    .from("scheduled_followups")
                    .update({
                        status: "failed",
                        error_message: error.message,
                    })
                    .eq("id", followup.id);

                console.error(`❌ Failed followup ${followup.id}:`, error);
            }
        }

        return new Response(
            JSON.stringify({ processed: followups?.length || 0 }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("Process followups error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
});

async function sendWhatsApp(phone: string, message: string) {
    // Usar WhatsApp Business API (quando implementar)
    // Por enquanto, apenas logar (usuário enviará manualmente)
    console.log(`WhatsApp to ${phone}: ${message.substring(0, 50)}...`);

    // TODO: Integrar com API real
    // const response = await fetch("https://api.whatsapp.com/send", ...);
}

async function sendEmail(to: string, subject: string, body: string) {
    // Usar Resend (já configurado no projeto)
    const { data, error } = await supabase.functions.invoke("send-ses-email", {
        body: { to, subject, html: body.replace(/\n/g, "<br>") },
    });

    if (error) throw error;
    return data;
}
