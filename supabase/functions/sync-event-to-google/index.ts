
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
    try {
        const { event_id, action } = await req.json();

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // 1. Buscar evento
        const { data: event, error: eventError } = await supabase
            .from("calendar_events")
            .select("*")
            .eq("id", event_id)
            .single();

        if (eventError) throw eventError;

        // 2. Buscar tokens do Google
        const { data: tokens, error: tokensError } = await supabase
            .from("google_calendar_tokens")
            .select("*")
            .eq("user_id", event.user_id)
            .single();

        if (tokensError || !tokens) {
            // Usuário não tem Google conectado - OK, apenas não sincroniza
            return new Response(
                JSON.stringify({ success: true, message: "User not connected to Google" }),
                { headers: { "Content-Type": "application/json" } }
            );
        }

        // 3. Garantir token válido
        const validToken = await ensureValidToken(tokens, supabase);

        // 4. Executar ação
        if (action === "create") {
            await createGoogleEvent(event, tokens.calendar_id, validToken, supabase);
        } else if (action === "update") {
            await updateGoogleEvent(event, tokens.calendar_id, validToken, supabase);
        } else if (action === "delete") {
            await deleteGoogleEvent(event, tokens.calendar_id, validToken, supabase);
        }

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("Sync error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
});

async function createGoogleEvent(event: any, calendarId: string, accessToken: string, supabase: any) {
    const googleEvent = {
        summary: event.title,
        description: event.description || "",
        location: event.location || "",
        start: {
            dateTime: event.start_time,
            timeZone: "America/Sao_Paulo",
        },
        end: {
            dateTime: event.end_time,
            timeZone: "America/Sao_Paulo",
        },
        colorId: getColorId(event.event_type),
    };

    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(googleEvent),
        }
    );

    if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
    }

    const createdEvent = await response.json();

    // Atualizar Supabase com google_event_id
    await supabase
        .from("calendar_events")
        .update({
            google_event_id: createdEvent.id,
            google_calendar_id: calendarId,
            is_synced: true,
            last_synced_at: new Date().toISOString(),
        })
        .eq("id", event.id);

    console.log(`Created Google event: ${createdEvent.id}`);
}

async function updateGoogleEvent(event: any, calendarId: string, accessToken: string, supabase: any) {
    if (!event.google_event_id) {
        // Se não tem ID do Google, criar novo
        await createGoogleEvent(event, calendarId, accessToken, supabase);
        return;
    }

    const googleEvent = {
        summary: event.title,
        description: event.description || "",
        location: event.location || "",
        start: {
            dateTime: event.start_time,
            timeZone: "America/Sao_Paulo",
        },
        end: {
            dateTime: event.end_time,
            timeZone: "America/Sao_Paulo",
        },
        colorId: getColorId(event.event_type),
    };

    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${event.google_event_id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(googleEvent),
        }
    );

    if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
    }

    await supabase
        .from("calendar_events")
        .update({
            is_synced: true,
            last_synced_at: new Date().toISOString(),
        })
        .eq("id", event.id);

    console.log(`Updated Google event: ${event.google_event_id}`);
}

async function deleteGoogleEvent(event: any, calendarId: string, accessToken: string, supabase: any) {
    if (!event.google_event_id) {
        // Sem ID do Google, apenas marcar como deletado
        return;
    }

    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${event.google_event_id}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok && response.status !== 404) {
        throw new Error(`Google API error: ${response.status}`);
    }

    console.log(`Deleted Google event: ${event.google_event_id}`);
}

function getColorId(eventType: string): string {
    // Google Calendar color IDs
    const colors: Record<string, string> = {
        wedding: "5", // Yellow (amarelo/dourado)
        social: "4", // Pink
        test: "8", // Gray
        personal: "9", // Blue
        blocked: "11", // Red
    };
    return colors[eventType] || "9";
}

async function ensureValidToken(tokenData: any, supabase: any): Promise<string> {
    const now = new Date();
    const expiry = new Date(tokenData.token_expiry);

    if (expiry.getTime() - now.getTime() > 5 * 60 * 1000) {
        return tokenData.access_token;
    }

    // Refresh token
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
            client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
            refresh_token: tokenData.refresh_token,
            grant_type: "refresh_token",
        }),
    });

    const newTokens = await response.json();

    await supabase
        .from("google_calendar_tokens")
        .update({
            access_token: newTokens.access_token,
            token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        })
        .eq("user_id", tokenData.user_id);

    return newTokens.access_token;
}
