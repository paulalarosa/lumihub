import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface EventData {
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  address?: string;
  color?: string;
}

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

function formatEventForGoogle(event: EventData) {
  const startDateTime = event.start_time
    ? `${event.event_date}T${event.start_time}`
    : event.event_date;

  const endDateTime = event.end_time
    ? `${event.event_date}T${event.end_time}`
    : event.start_time
      ? `${event.event_date}T${event.start_time.split(':').map((v: string, i: number) => i === 0 ? String(parseInt(v) + 1).padStart(2, '0') : v).join(':')}`
      : event.event_date;

  const isAllDay = !event.start_time;

  return {
    summary: event.title,
    description: event.description || '',
    location: event.address || event.location || '',
    start: isAllDay
      ? { date: event.event_date }
      : { dateTime: startDateTime, timeZone: 'America/Sao_Paulo' },
    end: isAllDay
      ? { date: event.event_date }
      : { dateTime: endDateTime, timeZone: 'America/Sao_Paulo' },
    colorId: getGoogleColorId(event.color || ''),
  };
}

function getGoogleColorId(hexColor: string): string {
  // Map hex colors to Google Calendar color IDs (1-11)
  const colorMap: Record<string, string> = {
    '#5A7D7C': '7',  // Peacock (teal)
    '#D4A574': '6',  // Tangerine
    '#8B7355': '5',  // Banana
    '#FF6B6B': '11', // Tomato
    '#4ECDC4': '7',  // Peacock
    '#45B7D1': '9',  // Blueberry
    '#96CEB4': '2',  // Sage
    '#FFEAA7': '5',  // Banana
    '#DDA0DD': '3',  // Grape
    '#98D8C8': '10', // Basil
  };
  return colorMap[hexColor?.toUpperCase()] || '1';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, event_id, event_data } = await req.json();

    // Get user's Google integration via Secure RPC
    const { data: integration, error: integrationError } = await supabase
      .rpc('get_google_integration', { p_user_id: user.id });

    if (integrationError || !integration) {
      return new Response(JSON.stringify({ error: 'Google Calendar not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token needs refresh
    let accessToken = integration.access_token;
    if (new Date(integration.token_expires_at) <= new Date()) {
      console.log('Token expired, refreshing...');
      accessToken = await refreshAccessToken(integration.refresh_token);

      if (!accessToken) {
        return new Response(JSON.stringify({ error: 'Failed to refresh token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update stored token secure via RPC
      await supabase.rpc('update_google_token', {
        p_integration_id: integration.id,
        p_access_token: accessToken,
        p_expires_in: 3600
      });
    }

    const calendarId = integration.calendar_id || 'primary';
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

    // CREATE event in Google Calendar
    if (action === 'create') {
      const googleEvent = formatEventForGoogle(event_data as EventData);
      console.log('Creating Google Calendar event:', googleEvent);

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEvent),
      });

      const result = await response.json();

      if (result.error) {
        console.error('Error creating Google event:', result);
        return new Response(JSON.stringify({ error: result.error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Google event created:', result.id);

      // Update local event with Google event ID
      if (event_id) {
        await supabase
          .from('events')
          .update({ google_calendar_event_id: result.id })
          .eq('id', event_id);
      }

      return new Response(JSON.stringify({ success: true, google_event_id: result.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // UPDATE event in Google Calendar
    if (action === 'update') {
      const { data: localEvent } = await supabase
        .from('events')
        .select('google_calendar_event_id')
        .eq('id', event_id)
        .single();

      if (!localEvent?.google_calendar_event_id) {
        // Event doesn't exist in Google, create it instead
        const googleEvent = formatEventForGoogle(event_data as EventData);
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        });

        const result = await response.json();
        if (!result.error) {
          await supabase
            .from('events')
            .update({ google_calendar_event_id: result.id })
            .eq('id', event_id);
        }

        return new Response(JSON.stringify({ success: true, google_event_id: result.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const googleEvent = formatEventForGoogle(event_data as EventData);
      console.log('Updating Google Calendar event:', localEvent.google_calendar_event_id);

      const response = await fetch(`${baseUrl}/${localEvent.google_calendar_event_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEvent),
      });

      const result = await response.json();

      if (result.error) {
        console.error('Error updating Google event:', result);
        return new Response(JSON.stringify({ error: result.error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE event from Google Calendar
    if (action === 'delete') {
      const { data: localEvent } = await supabase
        .from('events')
        .select('google_calendar_event_id')
        .eq('id', event_id)
        .single();

      if (!localEvent?.google_calendar_event_id) {
        return new Response(JSON.stringify({ success: true, message: 'No Google event to delete' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Deleting Google Calendar event:', localEvent.google_calendar_event_id);

      const response = await fetch(`${baseUrl}/${localEvent.google_calendar_event_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (!response.ok && response.status !== 404) {
        const result = await response.json();
        console.error('Error deleting Google event:', result);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SYNC - Full sync from Google to local
    if (action === 'sync-from-google') {
      console.log('Syncing events from Google Calendar...');

      // Get events from next 6 months
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

      const response = await fetch(
        `${baseUrl}?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      const result = await response.json();

      if (result.error) {
        console.error('Error fetching Google events:', result);
        return new Response(JSON.stringify({ error: result.error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const googleEvents = result.items || [];
      let imported = 0;
      let updated = 0;

      for (const gEvent of googleEvents) {
        // Check if event already exists
        const { data: existingEvent } = await supabase
          .from('events')
          .select('id')
          .eq('google_calendar_event_id', gEvent.id)
          .eq('user_id', user.id)
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
          user_id: user.id,
          color: '#5A7D7C',
        };

        if (existingEvent) {
          await supabase
            .from('events')
            .update(eventData)
            .eq('id', existingEvent.id);
          updated++;
        } else {
          await supabase
            .from('events')
            .insert(eventData);
          imported++;
        }
      }

      // Update last sync time
      await supabase
        .from('user_integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration.id);

      console.log(`Sync complete: ${imported} imported, ${updated} updated`);

      return new Response(JSON.stringify({ success: true, imported, updated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SYNC - Full sync from local to Google
    if (action === 'sync-to-google') {
      console.log('Syncing events to Google Calendar...');

      // Get all user events that don't have a Google ID yet
      const { data: localEvents } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .is('google_calendar_event_id', null);

      let synced = 0;

      for (const event of localEvents || []) {
        const googleEvent = formatEventForGoogle(event as EventData);

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        });

        const result = await response.json();

        if (!result.error) {
          await supabase
            .from('events')
            .update({ google_calendar_event_id: result.id })
            .eq('id', event.id);
          synced++;
        }
      }

      // Update last sync time
      await supabase
        .from('user_integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration.id);

      console.log(`Sync complete: ${synced} events sent to Google`);

      return new Response(JSON.stringify({ success: true, synced }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-calendar-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
