import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const welcomeEmailTemplate = (props: { brideName: string; portalLink: string; accessPin: string }) => `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vinda ao KONTROL</title>
    <style>
      body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 0; background-color: #000000; color: #e5e5e5; }
      .email-container { max-width: 600px; margin: 0 auto; background-color: #0c0c0c; border: 1px solid #333; }
      .header { background-color: #000000; padding: 40px 24px; text-align: center; border-bottom: 1px solid #333; }
      .header h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: normal; letter-spacing: 4px; text-transform: uppercase; }
      .content { padding: 40px 32px; }
      .greeting { color: #ffffff; font-size: 18px; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 1px; }
      .content p { color: #a3a3a3; font-size: 14px; line-height: 1.8; margin: 16px 0; }
      .pin-box { background-color: #111; border: 1px solid #ffffff; padding: 24px; margin: 32px 0; text-align: center; }
      .pin-label { color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; display: block; }
      .pin-value { color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace; }
      .button-container { text-align: center; margin: 40px 0; }
      .button { display: inline-block; background-color: #fff; color: #000; padding: 16px 40px; text-decoration: none; text-transform: uppercase; letter-spacing: 2px; font-size: 12px; font-weight: bold; }
      .button:hover { background-color: #ccc; }
      .footer { background-color: #000; padding: 32px; text-align: center; border-top: 1px solid #333; }
      .footer p { color: #444; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 8px 0; }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <h1>KONTROL // ACCESS</h1>
      </div>
      <div class="content">
        <p class="greeting">Olá ${props.brideName},</p>
        <p>Seu projeto de beleza para o grande dia foi oficialmente iniciado no <strong>KONTROL SYSTEM</strong>.</p>
        <p>Para visualizar seu contrato, cronograma e todos os detalhes técnicos da nossa jornada, acesse seu portal exclusivo utilizando as credenciais abaixo.</p>
        
        <div class="pin-box">
          <span class="pin-label">SEU PIN DE ACESSO</span>
          <span class="pin-value">${props.accessPin}</span>
        </div>

        <div class="button-container">
          <a href="${props.portalLink}" class="button">ACESSAR PORTAL DA NOIVA</a>
        </div>
        
        <p style="font-size: 12px; color: #666; text-align: center;">Recomendamos que assine seu contrato digitalmente o quanto antes para garantirmos a reserva da sua data.</p>
      </div>
      <div class="footer">
        <p>AUTHENTICATED BY KHAOS STUDIO</p>
        <p>COPYRIGHT © 2026</p>
      </div>
    </div>
  </body>
</html>
`;

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { clientId, projectName } = await req.json();

        if (!clientId) {
            throw new Error("Missing clientId");
        }

        // 1. Fetch Client
        const { data: client, error: clientError } = await supabaseClient
            .from("wedding_clients")
            .select("*")
            .eq("id", clientId)
            .single();

        if (clientError || !client) {
            throw new Error("Client not found");
        }

        let accessPin = client.access_pin;

        // 2. Generate PIN if missing
        if (!accessPin) {
            accessPin = Math.floor(1000 + Math.random() * 9000).toString();

            const { error: updateError } = await supabaseClient
                .from("wedding_clients")
                .update({ access_pin: accessPin })
                .eq("id", clientId);

            if (updateError) {
                console.error("Error updating PIN:", updateError);
                throw new Error("Failed to generate PIN");
            }
        }

        // 3. Send Email
        const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

        // Safety check just in case email is missing (though unlikely for a registered client)
        if (!client.email) {
            console.log("Client has no email, skipping send.");
            return new Response(JSON.stringify({ message: "Client has no email, skipped." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        const { data: emailData, error: emailError } = await resend.emails.send({
            from: "KONTROL <no-reply@khaoskontrol.com.br>",
            to: client.email,
            subject: "KONTROL // Seu acesso exclusivo ao Khaos Studio",
            html: welcomeEmailTemplate({
                brideName: client.name || "Noiva",
                portalLink: "https://khaoskontrol.com.br/portal",
                accessPin: accessPin
            }),
        });

        if (emailError) {
            console.error("Error sending email:", emailError);
            throw new Error("Failed to send email");
        }

        return new Response(JSON.stringify({ success: true, pinGenerated: !client.access_pin }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
