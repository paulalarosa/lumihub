import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const WEBHOOK_URL = Deno.env.get('WEBHOOK_URL')

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return json({ success: false, error: 'Google credentials missing' }, 500)
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return json({ success: false, error: 'Supabase credentials missing' }, 500)
    }

    const { code, user_id, redirect_uri } = (await req.json()) as {
      code?: string
      user_id?: string
      redirect_uri?: string
    }

    if (!code || !user_id) {
      return json({ success: false, error: 'Missing code or user_id' }, 400)
    }

    const callbackUri =
      redirect_uri || `${req.headers.get('origin')}/calendar/callback`

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = (await tokenResponse.json()) as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
      error?: string
      error_description?: string
    }

    if (tokens.error || !tokens.access_token) {
      return json(
        {
          success: false,
          error: `Google: ${tokens.error_description || tokens.error || 'no access token'}`,
        },
        400,
      )
    }

    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    )

    const calendars = (await calendarResponse.json()) as {
      items?: Array<{ id: string; primary?: boolean }>
    }
    const primaryCalendar = calendars.items?.find((cal) => cal.primary)

    if (!primaryCalendar) {
      return json({ success: false, error: 'No primary calendar found' }, 400)
    }

    let watchData: {
      resourceId: string | null
      expiration: string | null
      id: string | null
    } = { resourceId: null, expiration: null, id: null }

    if (WEBHOOK_URL && !WEBHOOK_URL.includes('localhost')) {
      try {
        const channelId = `khk-${user_id}-${Date.now()}`
        const watchResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(primaryCalendar.id)}/events/watch`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: channelId,
              type: 'web_hook',
              address: WEBHOOK_URL,
              token: user_id,
            }),
          },
        )
        const watchRes = (await watchResponse.json()) as {
          resourceId?: string
          expiration?: string
          error?: unknown
        }
        if (!watchRes.error) {
          watchData = {
            id: channelId,
            resourceId: watchRes.resourceId ?? null,
            expiration: watchRes.expiration ?? null,
          }
        }
      } catch (_) {
        // watch registration is non-critical, swallow
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { error: dbError } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(
          Date.now() + (tokens.expires_in ?? 3600) * 1000,
        ).toISOString(),
        calendar_id: primaryCalendar.id,
        channel_id: watchData.id,
        resource_id: watchData.resourceId,
        channel_expiry: watchData.expiration
          ? new Date(Number(watchData.expiration)).toISOString()
          : null,
      })

    if (dbError) {
      return json({ success: false, error: `DB: ${dbError.message}` }, 500)
    }

    initialSync(
      user_id,
      tokens.access_token,
      primaryCalendar.id,
      supabase,
    ).catch(() => {})

    return json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return json({ success: false, error: msg }, 500)
  }
})

async function initialSync(
  userId: string,
  accessToken: string,
  calendarId: string,
  supabase: ReturnType<typeof createClient>,
) {
  const timeMin = new Date()
  timeMin.setDate(timeMin.getDate() - 30)

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
      new URLSearchParams({
        timeMin: timeMin.toISOString(),
        maxResults: '250',
        singleEvents: 'true',
        orderBy: 'startTime',
      }),
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )

  if (!response.ok) return

  const data = (await response.json()) as {
    items?: Array<{
      id: string
      status?: string
      summary?: string
      description?: string
      location?: string
      start: { dateTime?: string; date?: string }
      end: { dateTime?: string; date?: string }
    }>
  }
  const events = data.items ?? []

  for (const ev of events) {
    if (ev.status === 'cancelled') continue
    await supabase.from('calendar_events').upsert(
      {
        user_id: userId,
        title: ev.summary || '(Sem título)',
        description: ev.description ?? null,
        start_time: ev.start.dateTime || ev.start.date,
        end_time: ev.end.dateTime || ev.end.date,
        location: ev.location ?? null,
        event_type: 'personal',
        google_event_id: ev.id,
        google_calendar_id: calendarId,
        is_synced: true,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,google_event_id' },
    )
  }
}
