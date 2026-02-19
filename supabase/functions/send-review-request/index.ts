import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Missing authorization header" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace("Bearer ", "")
        );

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { project_id } = await req.json();

        if (!project_id) {
            return new Response(
                JSON.stringify({ error: "Missing project_id" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select(`
        *,
        client:wedding_clients(*),
        artist:makeup_artists(*)
      `)
            .eq("id", project_id)
            .single();

        if (projectError || !project) {
            return new Response(
                JSON.stringify({ error: "Project not found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { data: existing } = await supabase
            .from("review_requests")
            .select("id")
            .eq("project_id", project_id)
            .eq("status", "pending")
            .maybeSingle();

        if (existing) {
            return new Response(
                JSON.stringify({ error: "Review request already pending for this project" }),
                { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const clientEmail = project.client?.email;
        if (!clientEmail) {
            return new Response(
                JSON.stringify({ error: "Client has no email address" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { data: request, error: requestError } = await supabase
            .from("review_requests")
            .insert({
                project_id,
                client_email: clientEmail,
                sent_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (requestError) throw requestError;

        const appUrl = Deno.env.get("APP_URL") || "https://khaoskontrol.com.br";
        const reviewUrl = `${appUrl}/avaliar/${request.review_token}`;

        await supabase
            .from("review_requests")
            .update({ review_url: reviewUrl })
            .eq("id", request.id);

        const artistName = project.artist?.name || "nossa equipe";
        const clientName = project.client?.name || "Cliente";

        const emailHtml = `<!DOCTYPE html>
<html>
<head>
<style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}
.content{background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px}
.button{display:inline-block;background:#667eea;color:#fff;padding:15px 30px;text-decoration:none;border-radius:5px;margin:20px 0;font-weight:bold}
.stars{font-size:30px;color:#ffc107;text-align:center;margin:20px 0}
.footer{font-size:12px;color:#666;margin-top:30px;text-align:center}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1 style="margin:0">Como foi sua experiencia?</h1>
</div>
<div class="content">
<p>Ola ${clientName}!</p>
<p>Esperamos que voce tenha adorado sua maquiagem!</p>
<p>Sua opiniao e muito importante para nos. Poderia avaliar nosso servico?</p>
<div class="stars">&#11088;&#11088;&#11088;&#11088;&#11088;</div>
<div style="text-align:center">
<a href="${reviewUrl}" class="button">Deixar Avaliacao</a>
</div>
<p class="footer">Este link e valido por 60 dias.<br>${artistName}</p>
</div>
</div>
</body>
</html>`;

        try {
            await supabase.functions.invoke("send-ses-email", {
                body: {
                    to: clientEmail,
                    subject: `Como foi sua experiencia com ${artistName}?`,
                    html: emailHtml,
                },
            });
        } catch (_emailErr: unknown) {
        }

        return new Response(
            JSON.stringify({
                request_id: request.id,
                review_url: reviewUrl,
                status: "sent",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
