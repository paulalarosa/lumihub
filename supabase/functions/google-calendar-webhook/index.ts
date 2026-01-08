import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (data.error) {
    console.error('Token refresh error:', data);
    return null;
  }

  return data.access_token;
}

serve(async (req) => {
  // Webhooks from Google are POST requests
  if (req.method !== 'POST') {
    return new Response('OK', { status: 200 });
  }

  try {
    const channelId = req.headers.get('x-goog-channel-id');
    const resourceState = req.headers.get('x-goog-resource-state');
    const resourceId = req.headers.get('x-goog-resource-id');

    console.log('Webhook received:', { channelId, resourceState, resourceId });

    if (!channelId || resourceState === 'sync') {
      // Initial sync notification, just acknowledge
      return new Response('OK', { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find the integration by channel ID
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('google_channel_id', channelId)
      .single();

    if (integrationError || !integration) {
      console.error('Integration not found for channel:', channelId);
      return new Response('OK', { status: 200 });
    }

    // Refresh token if needed
    let accessToken = integration.access_token;
    if (new Date(integration.token_expires_at) <= new Date()) {
      accessToken = await refreshAccessToken(integration.refresh_token);
      
      if (accessToken) {
        await supabase
          .from('user_integrations')
          .update({
            access_token: accessToken,
            token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          })
          .eq('id', integration.id);
      }
    }

    if (!accessToken) {
      console.error('Could not get access token');
      return new Response('OK', { status: 200 });
    }

    // Fetch changed events from Google
    const calendarId = integration.calendar_id || 'primary';
    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Last 7 days
    const timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // Next year

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=100`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    const result = await response.json();

    if (result.error) {
      console.error('Error fetching Google events:', result);
      return new Response('OK', { status: 200 });
    }

    const googleEvents = result.items || [];
    const userId = integration.user_id;

    console.log(`Processing ${googleEvents.length} events from Google...`);

    for (const gEvent of googleEvents) {
      // Skip cancelled events
      if (gEvent.status === 'cancelled') {
        // Delete from local if exists
        await supabase
          .from('events')
          .delete()
          .eq('google_calendar_event_id', gEvent.id)
          .eq('user_id', userId);
        continue;
      }

      // Check if event already exists locally
      const { data: existingEvent } = await supabase
        .from('events')
        .select('id, updated_at')
        .eq('google_calendar_event_id', gEvent.id)
        .eq('user_id', userId)
        .maybeSingle();

      const eventDate = gEvent.start?.date || gEvent.start?.dateTime?.split('T')[0];
      const startTime = gEvent.start?.dateTime?.split('T')[1]?.substring(0, 5) || null;
      const endTime = gEvent.end?.dateTime?.split('T')[1]?.substring(0, 5) || null;

      const eventData = {
        title: gEvent.summary || 'Sem título',
        description: gEvent.description || null,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        location: gEvent.location || null,
        google_calendar_event_id: gEvent.id,
        user_id: userId,
        color: '#5A7D7C',
      };

      if (existingEvent) {
        // Check if Google event is newer
        const googleUpdated = new Date(gEvent.updated);
        const localUpdated = new Date(existingEvent.updated_at);
        
        if (googleUpdated > localUpdated) {
          await supabase
            .from('events')
            .update(eventData)
            .eq('id', existingEvent.id);
        }
      } else {
        // Create new local event
        await supabase
          .from('events')
          .insert(eventData);
      }
    }

    // Update last sync time
    await supabase
      .from('user_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);

    console.log('Webhook processing complete');

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Error in google-calendar-webhook:', error);
    return new Response('OK', { status: 200 });
  }
});
