import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { fetchWithRetry } from '../_shared/retry.ts'
import { Logger } from '../_shared/logger.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const logger = new Logger('google-calendar-sync')

function getEnv(key: string): string | null {
  const val = Deno.env.get(key)
  if (!val) {
    return null
  }
  return val
}

const GOOGLE_CLIENT_ID = getEnv('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = getEnv('GOOGLE_CLIENT_SECRET')
const SUPABASE_URL = getEnv('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')

interface EventData {
  title: string
  description?: string
  event_date: string
  start_time?: string
  end_time?: string
  location?: string
  address?: string
  color?: string
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<string | null> {
  try {
    const response = await fetchWithRetry(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      },
    )

    const data = (await response.json()) as {
      access_token?: string
      error?: any
    }
    if (data.error) {
      await logger.error('Token refresh error:', { error: data })
      return null
    }

    return data.access_token || null
  } catch (error) {
    await logger.error('Failed to refresh token after retries', { error })
    return null
  }
}

function formatEventForGoogle(event: EventData) {
  const startDateTime = event.start_time
    ? `${event.event_date}T${event.start_time}`
    : event.event_date

  const endDateTime = event.end_time
    ? `${event.event_date}T${event.end_time}`
    : event.start_time
      ? `${event.event_date}T${event.start_time
          .split(':')
          .map((v: string, i: number) =>
            i === 0 ? String(parseInt(v) + 1).padStart(2, '0') : v,
          )
          .join(':')}`
      : event.event_date

  const isAllDay = !event.start_time

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
  }
}

function getGoogleColorId(hexColor: string): string {
  const colorMap: Record<string, string> = {
    '#5A7D7C': '7',
    '#D4A574': '6',
    '#8B7355': '5',
    '#FF6B6B': '11',
    '#4ECDC4': '7',
    '#45B7D1': '9',
    '#96CEB4': '2',
    '#FFEAA7': '5',
    '#DDA0DD': '3',
    '#98D8C8': '10',
  }
  return colorMap[hexColor?.toUpperCase()] || '1'
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (
      !SUPABASE_URL ||
      !SUPABASE_SERVICE_ROLE_KEY ||
      !GOOGLE_CLIENT_ID ||
      !GOOGLE_CLIENT_SECRET
    ) {
      const missing = []
      if (!SUPABASE_URL) missing.push('SUPABASE_URL')
      if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
      if (!GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID')
      if (!GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET')

      return new Response(
        JSON.stringify({
          error: 'Service configuration error',
          details: 'Missing API Keys',
          missing_keys: missing,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { action, event_id, event_data, user_token } = (await req.json()) as {
      action: string
      event_id?: string
      event_data?: Partial<EventData>
      user_token?: string
    }

    // Accept token from body (ES256 gateway bypass) OR Authorization header (legacy).
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const authHeader = req.headers.get('Authorization')
    const bearerFromHeader = authHeader?.replace('Bearer ', '') ?? null
    const token =
      user_token ||
      (bearerFromHeader && bearerFromHeader !== anonKey
        ? bearerFromHeader
        : null)

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing user token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch token directly from google_calendar_tokens (canonical table).
    const { data: tokenRow, error: tokenErr } = await supabase
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, token_expiry, calendar_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (tokenErr || !tokenRow) {
      return new Response(
        JSON.stringify({
          error: 'Google Calendar not connected',
          detail: tokenErr?.message ?? 'no tokens row for this user',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    let accessToken: string | null = tokenRow.access_token
    const expiry = tokenRow.token_expiry ? new Date(tokenRow.token_expiry) : null
    const isExpired = !expiry || expiry.getTime() - Date.now() < 60_000

    if (isExpired && tokenRow.refresh_token) {
      accessToken = await refreshAccessToken(tokenRow.refresh_token)
      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: 'Failed to refresh token' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
      // Update stored token + new expiry (~55min safety margin)
      await supabase
        .from('google_calendar_tokens')
        .update({
          access_token: accessToken,
          token_expiry: new Date(Date.now() + 3300 * 1000).toISOString(),
        })
        .eq('user_id', user.id)
    }

    const calendarId = tokenRow.calendar_id || 'primary'
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`

    if (action === 'create') {
      const googleEvent = formatEventForGoogle(event_data as EventData)
      await logger.info('Creating Google Calendar event', { googleEvent })

      const response = await fetchWithRetry(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEvent),
      })

      const result = (await response.json()) as any

      if (result.error) {
        await logger.error('Error creating Google event', { error: result })
        return new Response(JSON.stringify({ error: result.error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (event_id) {
        await supabase
          .from('events')
          .update({ google_calendar_event_id: result.id })
          .eq('id', event_id)
      }

      return new Response(
        JSON.stringify({ success: true, google_event_id: result.id }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (action === 'update') {
      const { data: localEvent } = await supabase
        .from('events')
        .select('google_calendar_event_id')
        .eq('id', event_id)
        .single()

      if (!localEvent?.google_calendar_event_id) {
        const googleEvent = formatEventForGoogle(event_data as EventData)
        const response = await fetchWithRetry(baseUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        })

        const result = (await response.json()) as any
        if (!result.error) {
          await supabase
            .from('events')
            .update({ google_calendar_event_id: result.id })
            .eq('id', event_id)
        }

        return new Response(
          JSON.stringify({ success: true, google_event_id: result.id }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      const googleEvent = formatEventForGoogle(event_data as EventData)
      await logger.info('Updating Google Calendar event', {
        eventId: localEvent.google_calendar_event_id,
      })

      const response = await fetchWithRetry(
        `${baseUrl}/${localEvent.google_calendar_event_id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        },
      )

      const result = (await response.json()) as any

      if (result.error) {
        return new Response(JSON.stringify({ error: result.error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'delete') {
      const { data: localEvent } = await supabase
        .from('events')
        .select('google_calendar_event_id')
        .eq('id', event_id)
        .single()

      if (!localEvent?.google_calendar_event_id) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'No Google event to delete',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      const response = await fetchWithRetry(
        `${baseUrl}/${localEvent.google_calendar_event_id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )

      if (!response.ok && response.status !== 404) {
        const result = (await response.json()) as any
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'sync-from-google') {
      const timeMin = new Date().toISOString()
      const timeMax = new Date(
        Date.now() + 180 * 24 * 60 * 60 * 1000,
      ).toISOString()

      const response = await fetchWithRetry(
        `${baseUrl}?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )

      const result = (await response.json()) as any

      if (result.error) {
        return new Response(JSON.stringify({ error: result.error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const googleEvents = result.items || []
      let imported = 0
      let updated = 0

      for (const gEvent of googleEvents) {
        const { data: existingEvent } = await supabase
          .from('events')
          .select('id')
          .eq('google_calendar_event_id', gEvent.id)
          .eq('user_id', user.id)
          .maybeSingle()

        const eventDate =
          gEvent.start?.date || gEvent.start?.dateTime?.split('T')[0]
        const startTime =
          gEvent.start?.dateTime?.split('T')[1]?.substring(0, 5) || null
        const endTime =
          gEvent.end?.dateTime?.split('T')[1]?.substring(0, 5) || null

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
        }

        if (existingEvent) {
          await supabase
            .from('events')
            .update(eventData)
            .eq('id', existingEvent.id)
          updated++
        } else {
          await supabase.from('events').insert(eventData)
          imported++
        }
      }

      await supabase
        .from('google_calendar_tokens')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', user.id)

      return new Response(
        JSON.stringify({ success: true, imported, updated }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (action === 'sync-to-google') {
      const { data: localEvents } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .is('google_calendar_event_id', null)

      let synced = 0

      for (const event of localEvents || []) {
        const googleEvent = formatEventForGoogle(event as EventData)

        const response = await fetchWithRetry(baseUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        })

        const result = (await response.json()) as { id?: string; error?: any }

        if (!result.error) {
          await supabase
            .from('events')
            .update({ google_calendar_event_id: result.id })
            .eq('id', event.id)
          synced++
        }
      }

      await supabase
        .from('google_calendar_tokens')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', user.id)

      return new Response(JSON.stringify({ success: true, synced }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
