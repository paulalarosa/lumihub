
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_URL = Deno.env.get("WEBHOOK_URL")!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { code, user_id, redirect_uri } = await req.json();

        // Default redirect URI if not provided
        const callbackUri = redirect_uri || `${req.headers.get("origin")}/calendar/callback`;

        console.log(`Exchange code for user ${user_id} with callback ${callbackUri}`);

        // 1. Trocar code por tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: callbackUri,
                grant_type: "authorization_code",
            }),
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            console.error("Token error:", tokens);
            throw new Error(`Google Token Error: ${tokens.error_description || tokens.error}`);
        }

        if (!tokens.access_token) {
            throw new Error("Failed to get access token from Google");
        }

        // 2. Buscar calendário principal
        const calendarResponse = await fetch(
            "https://www.googleapis.com/calendar/v3/users/me/calendarList",
            {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            }
        );

        const calendars = await calendarResponse.json();
        const primaryCalendar = calendars.items?.find((cal: any) => cal.primary);

        if (!primaryCalendar) {
            throw new Error("No primary calendar found for this Google account");
        }

        // 3. Configurar webhook (watch) no Google Calendar
        // Note: This requires a valid HTTPS domain registered in Google Cloud Console
        let watchData = { resourceId: null, expiration: null, id: null };

        // Only attempt watch if WEBHOOK_URL is set (skip in local if not tunneled)
        if (WEBHOOK_URL && !WEBHOOK_URL.includes("localhost")) {
            const channelId = `khaos-${user_id}-${Date.now()}`;
            console.log(`Setting up watch on calendar ${primaryCalendar.id} with channel ${channelId}`);

            const watchResponse = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(primaryCalendar.id)}/events/watch`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${tokens.access_token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id: channelId,
                        type: "web_hook",
                        address: WEBHOOK_URL,
                        token: user_id, // Para identificar o usuário no webhook
                    }),
                }
            );

            const watchResJson = await watchResponse.json();

            if (watchResJson.error) {
                console.error("Watch setup failed (non-fatal):", watchResJson.error);
            } else {
                watchData = watchResJson;
                watchData.id = channelId;
            }
        } else {
            console.warn("Skipping Google Webhook Watch: WEBHOOK_URL is missing or localhost.");
        }

        // 4. Salvar tokens no Supabase
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        const { error: dbError } = await supabase
            .from("google_calendar_tokens")
            .upsert({
                user_id,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                calendar_id: primaryCalendar.id,
                channel_id: watchData.id,
                resource_id: watchData.resourceId,
                channel_expiry: watchData.expiration ? new Date(Number(watchData.expiration)).toISOString() : null,
            });

        if (dbError) throw dbError;

        // 5. Fazer sync inicial
        // Fire and forget (don't await to speed up response)
        initialSync(user_id, tokens.access_token, primaryCalendar.id, supabase).catch(err =>
            console.error("Initial sync background error:", err)
        );

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("Exchange error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

async function initialSync(userId: string, accessToken: string, calendarId: string, supabase: any) {
    console.log(`Starting initial sync for ${userId}`);

    // Buscar eventos dos últimos 30 dias
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);

    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
        new URLSearchParams({
            timeMin: timeMin.toISOString(),
            maxResults: "250",
            singleEvents: "true",
            orderBy: "startTime",
        }),
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
        console.error("Initial sync failed:", await response.text());
        return;
    }

    const data = await response.json();
    const events = data.items || [];

    // Inserir eventos no Khaos Kontrol
    for (const googleEvent of events) {
        if (googleEvent.status === "cancelled") continue;

        const eventData = {
            user_id: userId,
            title: googleEvent.summary || "(Sem título)",
            description: googleEvent.description || null,
            start_time: googleEvent.start.dateTime || googleEvent.start.date,
            end_time: googleEvent.end.dateTime || googleEvent.end.date,
            location: googleEvent.location || null,
            event_type: "personal", // Default for Google imports
            google_event_id: googleEvent.id,
            google_calendar_id: calendarId,
            is_synced: true,
            last_synced_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("calendar_events").upsert(eventData, {
            onConflict: 'user_id,google_event_id',
            ignoreDuplicates: false
        });

        if (error) console.error(`Failed to upsert event ${googleEvent.id}:`, error);
    }

    console.log(`Initial sync finished: imported ${events.length} events for ${userId}`);
}
