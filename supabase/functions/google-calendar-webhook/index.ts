
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

serve(async (req) => {
  try {
    // Google envia notificações via webhook quando há mudanças
    const headers = req.headers;
    const channelId = headers.get("x-goog-channel-id");
    const resourceState = headers.get("x-goog-resource-state"); // sync, exists, not_exists
    const resourceId = headers.get("x-goog-resource-id");

    console.log("Webhook received:", { channelId, resourceState, resourceId });

    // Se é apenas confirmação de sync, retornar OK
    if (resourceState === "sync") {
      return new Response("OK", { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Encontrar usuário pelo channel_id
    const { data: tokenData } = await supabase
      .from("google_calendar_tokens")
      .select("*")
      .eq("channel_id", channelId)
      .single();

    if (!tokenData) {
      console.error("Token not found for channel:", channelId);
      // We return 200 to stop Google from retrying if it's a stale channel
      return new Response("Token not found", { status: 200 });
    }

    // Buscar mudanças incrementais do Google Calendar
    await syncFromGoogleToKhaos(tokenData, supabase);

    return new Response("Sync completed", { status: 200 });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(error.message, { status: 500 });
  }
});

async function syncFromGoogleToKhaos(tokenData: any, supabase: any) {
  const { user_id, access_token, calendar_id, sync_token } = tokenData;

  // Verificar se token expirou e refresh se necessário
  const validToken = await ensureValidToken(tokenData, supabase);

  // Buscar eventos incrementais do Google Calendar
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(calendar_id) + "/events");

  // Se tem sync_token, usar para buscar apenas mudanças
  if (sync_token) {
    url.searchParams.set("syncToken", sync_token);
  } else {
    // Primeira sync ou Full sync fallback: buscar últimos 30 dias
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);
    url.searchParams.set("timeMin", timeMin.toISOString());
  }

  // IMPORTANTE: Expandir eventos recorrentes em instâncias individuais
  url.searchParams.set("singleEvents", "true");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${validToken}`,
    },
  });

  if (response.status === 410) {
    // Sync token expired/invalid. Clear it and retry full sync
    console.warn("Sync token invalid (410), performing full resync");
    await supabase.from("google_calendar_tokens").update({ sync_token: null }).eq("user_id", user_id);
    tokenData.sync_token = null;
    return syncFromGoogleToKhaos(tokenData, supabase);
  }

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const events = data.items || [];
  const newSyncToken = data.nextSyncToken;

  // Processar cada evento
  for (const googleEvent of events) {
    await upsertEventFromGoogle(googleEvent, user_id, calendar_id, supabase);
  }

  // Atualizar sync token
  if (newSyncToken) {
    await supabase
      .from("google_calendar_tokens")
      .update({
        sync_token: newSyncToken,
        last_sync_at: new Date().toISOString(),
      })
      .eq("user_id", user_id);
  }

  console.log(`Synced ${events.length} events from Google to Khaos`);
}

async function upsertEventFromGoogle(googleEvent: any, userId: string, calendarId: string, supabase: any) {
  // Se evento foi deletado no Google
  if (googleEvent.status === "cancelled") {
    // Check if we should delete or if it was already deleted/modified in Khaos
    // For now, simpler: Google deletion propagates to Khaos
    await supabase
      .from("calendar_events")
      .delete()
      .eq("google_event_id", googleEvent.id)
      .eq("user_id", userId);

    console.log("Deleted event:", googleEvent.id);
    return;
  }

  // Buscar evento existente para verificar conflitos
  const { data: existingEvent } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('google_event_id', googleEvent.id)
    .eq('user_id', userId)
    .single();

  // Parse dados do Google Event
  const eventData = {
    user_id: userId,
    title: googleEvent.summary || "(Sem título)",
    description: googleEvent.description || null,
    // Google sends dateTime for timed events, date for all-day
    start_time: googleEvent.start.dateTime || googleEvent.start.date,
    end_time: googleEvent.end.dateTime || googleEvent.end.date,
    location: googleEvent.location || null,
    event_type: existingEvent?.event_type || "personal", // Manter tipo existente se houver
    status: googleEvent.status === "confirmed" ? "confirmed" : "tentative",
    google_event_id: googleEvent.id,
    google_calendar_id: calendarId,
    is_synced: true,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (existingEvent) {
    // Verificar conflito: Ambos modificados após último sync?
    const googleUpdated = new Date(googleEvent.updated);
    const khaosUpdated = new Date(existingEvent.updated_at);
    const lastSynced = existingEvent.last_synced_at ? new Date(existingEvent.last_synced_at) : new Date(0);

    // Margem de segurança de 2 segundos para evitar loops de sync
    const safetyMargin = 2000;

    // Se Khaos foi atualizado DEPOIS do último sync E Google também (conflito real)
    const khaosChangedRecently = khaosUpdated.getTime() > (lastSynced.getTime() + safetyMargin);

    // Note: Google's 'updated' field changes on every edit.
    // If we just pushed to Google, googleUpdated will be new.
    // We need to assume if we are receiving a webhook, Google definitely changed.

    if (khaosChangedRecently) {
      console.log("Conflict detected for event:", googleEvent.id);

      // Registrar conflito
      await supabase.from('sync_conflicts').insert({
        event_id: existingEvent.id,
        conflict_type: 'update_conflict',
        khaos_version: existingEvent,
        google_version: googleEvent,
        resolved: true, // Auto-resolving via LWW
        resolution: googleUpdated > khaosUpdated ? 'google_wins' : 'khaos_wins',
        resolved_at: new Date().toISOString()
      });

      // LWW: Se Google é mais recente, atualiza. Se Khaos é mais recente, ignora este webhook.
      if (khaosUpdated > googleUpdated) {
        console.log("Khaos version wins. Ignoring Google update.");
        return;
      }
    }
  }

  // Upsert (inserir ou atualizar) - Google Wins ou Sem Conflito
  const { error } = await supabase
    .from("calendar_events")
    .upsert(eventData, {
      onConflict: "user_id,google_event_id",
      ignoreDuplicates: false,
    });

  if (error) {
    console.error("Error upserting event:", error);
  } else {
    console.log("Upserted event (Google Wins):", googleEvent.id);
  }
}

async function ensureValidToken(tokenData: any, supabase: any): Promise<string> {
  const now = new Date();
  const expiry = new Date(tokenData.token_expiry);

  // Se token ainda é válido (com margem de 5 minutos)
  if (expiry.getTime() - now.getTime() > 5 * 60 * 1000) {
    return tokenData.access_token;
  }

  console.log("Refreshing Google Token for user", tokenData.user_id);

  // Refresh token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: tokenData.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const newTokens = await response.json();

  if (newTokens.error) {
    throw new Error(`Token Refresh Failed: ${newTokens.error_description}`);
  }

  // Calculate new expiry. If expires_in not returned, assume 1 hour.
  const expiresIn = newTokens.expires_in || 3600;

  // Atualizar no banco
  await supabase
    .from("google_calendar_tokens")
    .update({
      access_token: newTokens.access_token,
      token_expiry: new Date(Date.now() + expiresIn * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", tokenData.user_id);

  return newTokens.access_token;
}
