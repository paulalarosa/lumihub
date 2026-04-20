import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!

serve(async (req) => {
  try {
    const headers = req.headers
    const channelId = headers.get('x-goog-channel-id')
    const resourceState = headers.get('x-goog-resource-state')
    const resourceId = headers.get('x-goog-resource-id')

    if (resourceState === 'sync') {
      return new Response('OK', { status: 200 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: tokenData } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('channel_id', channelId)
      .single()

    if (!tokenData) {
      return new Response('Token not found', { status: 200 })
    }

    await syncFromGoogleToKhaos(tokenData, supabase)

    return new Response('Sync completed', { status: 200 })
  } catch (error: any) {
    return new Response(error.message, { status: 500 })
  }
})

async function syncFromGoogleToKhaos(tokenData: any, supabase: any) {
  const { user_id, access_token, calendar_id, sync_token } = tokenData

  const validToken = await ensureValidToken(tokenData, supabase)

  const url = new URL(
    'https://www.googleapis.com/calendar/v3/calendars/' +
      encodeURIComponent(calendar_id) +
      '/events',
  )

  if (sync_token) {
    url.searchParams.set('syncToken', sync_token)
  } else {
    const timeMin = new Date()
    timeMin.setDate(timeMin.getDate() - 30)
    url.searchParams.set('timeMin', timeMin.toISOString())
  }

  url.searchParams.set('singleEvents', 'true')

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${validToken}`,
    },
  })

  if (response.status === 410) {
    await supabase
      .from('google_calendar_tokens')
      .update({ sync_token: null })
      .eq('user_id', user_id)
    tokenData.sync_token = null
    return syncFromGoogleToKhaos(tokenData, supabase)
  }

  if (!response.ok) {
    throw new Error(
      `Google API error: ${response.status} ${await response.text()}`,
    )
  }

  const data = await response.json()
  const events = data.items || []
  const newSyncToken = data.nextSyncToken

  for (const googleEvent of events) {
    await upsertEventFromGoogle(googleEvent, user_id, calendar_id, supabase)
  }

  if (newSyncToken) {
    await supabase
      .from('google_calendar_tokens')
      .update({
        sync_token: newSyncToken,
        last_sync_at: new Date().toISOString(),
      })
      .eq('user_id', user_id)
  }
}

async function upsertEventFromGoogle(
  googleEvent: any,
  userId: string,
  calendarId: string,
  supabase: any,
) {
  // We use `events` (primary table read by the frontend), NOT `calendar_events`.
  if (googleEvent.status === 'cancelled') {
    await supabase
      .from('events')
      .delete()
      .eq('google_calendar_event_id', googleEvent.id)
      .eq('user_id', userId)
    return
  }

  // Google returns either { dateTime, timeZone } (timed) or { date } (all-day).
  const startIso = googleEvent.start?.dateTime || googleEvent.start?.date
  const endIso = googleEvent.end?.dateTime || googleEvent.end?.date
  if (!startIso) return

  // event_date is required (DATE). start_time/end_time are TIMESTAMPs (nullable).
  const eventDate = startIso.slice(0, 10)
  const isAllDay = !googleEvent.start?.dateTime

  const { data: existingEvent } = await supabase
    .from('events')
    .select('*')
    .eq('google_calendar_event_id', googleEvent.id)
    .eq('user_id', userId)
    .maybeSingle()

  const eventData = {
    user_id: userId,
    title: googleEvent.summary || '(Sem título)',
    description: googleEvent.description || null,
    event_date: eventDate,
    start_time: isAllDay ? null : startIso,
    end_time: isAllDay ? null : (endIso ?? null),
    location: googleEvent.location || null,
    event_type: existingEvent?.event_type || 'personal',
    google_calendar_event_id: googleEvent.id,
    google_calendar_id: calendarId,
    is_synced: true,
    last_synced_at: new Date().toISOString(),
  }

  if (existingEvent) {
    // Last-write-wins — Google event updated time vs Khaos last_synced_at.
    const googleUpdated = new Date(googleEvent.updated ?? Date.now())
    const lastSynced = existingEvent.last_synced_at
      ? new Date(existingEvent.last_synced_at)
      : new Date(0)

    if (googleUpdated.getTime() <= lastSynced.getTime()) return

    await supabase
      .from('events')
      .update(eventData)
      .eq('id', existingEvent.id)
  } else {
    await supabase.from('events').insert(eventData)
  }
}

async function ensureValidToken(
  tokenData: any,
  supabase: any,
): Promise<string> {
  const now = new Date()
  const expiry = new Date(tokenData.token_expiry)

  if (expiry.getTime() - now.getTime() > 5 * 60 * 1000) {
    return tokenData.access_token
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: tokenData.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  const newTokens = await response.json()

  if (newTokens.error) {
    throw new Error(`Token Refresh Failed: ${newTokens.error_description}`)
  }

  const expiresIn = newTokens.expires_in || 3600

  await supabase
    .from('google_calendar_tokens')
    .update({
      access_token: newTokens.access_token,
      token_expiry: new Date(Date.now() + expiresIn * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', tokenData.user_id)

  return newTokens.access_token
}
