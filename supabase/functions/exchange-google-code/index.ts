import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const WEBHOOK_URL = Deno.env.get('WEBHOOK_URL')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, user_id, redirect_uri } = await req.json()

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

    const tokens = await tokenResponse.json()

    if (tokens.error) {
      throw new Error(
        `Google Token Error: ${tokens.error_description || tokens.error}`,
      )
    }

    if (!tokens.access_token) {
      throw new Error('Failed to get access token from Google')
    }

    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      },
    )

    const calendars = await calendarResponse.json()
    const primaryCalendar = calendars.items?.find((cal: any) => cal.primary)

    if (!primaryCalendar) {
      throw new Error('No primary calendar found for this Google account')
    }

    let watchData = { resourceId: null, expiration: null, id: null }

    if (WEBHOOK_URL && !WEBHOOK_URL.includes('localhost')) {
      const channelId = `khaos-${user_id}-${Date.now()}`

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

      const watchResJson = await watchResponse.json()

      if (watchResJson.error) {
      } else {
        watchData = watchResJson
        watchData.id = channelId
      }
    } else {
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { error: dbError } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(
          Date.now() + tokens.expires_in * 1000,
        ).toISOString(),
        calendar_id: primaryCalendar.id,
        channel_id: watchData.id,
        resource_id: watchData.resourceId,
        channel_expiry: watchData.expiration
          ? new Date(Number(watchData.expiration)).toISOString()
          : null,
      })

    if (dbError) throw dbError

    initialSync(
      user_id,
      tokens.access_token,
      primaryCalendar.id,
      supabase,
    ).catch((_err) => {
      // ignore initial sync errors
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

async function initialSync(
  userId: string,
  accessToken: string,
  calendarId: string,
  supabase: any,
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

  if (!response.ok) {
    return
  }

  const data = await response.json()
  const events = data.items || []

  for (const googleEvent of events) {
    if (googleEvent.status === 'cancelled') continue

    const eventData = {
      user_id: userId,
      title: googleEvent.summary || '(Sem título)',
      description: googleEvent.description || null,
      start_time: googleEvent.start.dateTime || googleEvent.start.date,
      end_time: googleEvent.end.dateTime || googleEvent.end.date,
      location: googleEvent.location || null,
      event_type: 'personal',
      google_event_id: googleEvent.id,
      google_calendar_id: calendarId,
      is_synced: true,
      last_synced_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('calendar_events').upsert(eventData, {
      onConflict: 'user_id,google_event_id',
      ignoreDuplicates: false,
    })

    if (error) continue
  }
}
