import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER"); // e.g., 'whatsapp:+14155238886'
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface InviteWhatsAppRequest {
    to: string; // E.164 format, e.g., +5511999999999
    makeup_artist_name: string;
    invite_link: string;
    invite_id: string;
}

serve(async (req) => {
    // CORS headers
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    try {
        const { to, makeup_artist_name, invite_link, invite_id }: InviteWhatsAppRequest = await req.json();

        if (!to || !makeup_artist_name || !invite_link || !invite_id) {
            throw new Error("Missing required fields");
        }

        let messageSid = "mock_sid_" + Date.now();
        const status = "sent";

        // Check if Twilio is configured
        if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
            console.log(`Sending WhatsApp using Twilio to ${to}`);

            // Twilio API Call
            // Use URL encoded form data
            const body = new URLSearchParams({
                To: `whatsapp:${to.replace('whatsapp:', '')}`, // Ensure prefix
                From: TWILIO_PHONE_NUMBER,
                Body: `Olá! ${makeup_artist_name} te convidou para ser assistente no Khaos Kontrol. \n\nAcesse o link para aceitar: ${invite_link}`
            });

            const response = await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
                    },
                    body: body,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error("Twilio Error:", data);
                throw new Error(data.message || "Failed to send WhatsApp");
            }

            messageSid = data.sid;
        } else {
            console.warn("Twilio credentials not found. Mocking successful send.");
            // In a real scenario, we might want to throw error if not configured, 
            // but for scaffolding we allow "mock" success.
        }

        // Log notification in database
        if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

            await supabase.from("notification_logs").insert({
                invite_id,
                type: "whatsapp",
                recipient: to,
                status: status,
                provider_id: messageSid,
            });
        }

        return new Response(
            JSON.stringify({
                success: true,
                message_id: messageSid,
                message: "WhatsApp sent successfully (or mocked)"
            }),
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                }
            }
        );

    } catch (error: any) {
        console.error("WhatsApp sending error:", error);

        // Log failed notification
        try {
            if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
                const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
                // Try to get body again? might fail if already read. 
                // We should have parsed it earlier. 
                // For simplicity, we skip logging body details if fail before parsing.
                // Assuming we have invite_id from parsing:
                // Actually we can't reliable get invite_id if parsing failed or variables not set.
                // But if we caught error after parsing:
                const body = await req.clone().json().catch(() => ({}));
                if (body.invite_id) {
                    await supabase.from("notification_logs").insert({
                        invite_id: body.invite_id,
                        type: "whatsapp",
                        recipient: body.to,
                        status: "failed",
                        error_message: error.message,
                    });
                }
            }
        } catch (logError) {
            console.error("Failed to log error:", logError);
        }

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                }
            }
        );
    }
});
