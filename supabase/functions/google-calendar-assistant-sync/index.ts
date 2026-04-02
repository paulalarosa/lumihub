import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface Assistant {
  id: string
  google_calendar_token: string | null
  google_refresh_token: string | null
}

interface SyncResult {
  assistantId: string
  success: boolean
  eventId?: string
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    )

    const { action, eventId, eventData, assistantIds } = await req.json()

    if (action === 'sync_event_to_assistants') {
      const { data: assistants, error: assistantsError } = await supabaseClient
        .from('assistants')
        .select('id, google_calendar_token, google_refresh_token')
        .in('id', assistantIds)
        .not('google_calendar_token', 'is', null)

      if (assistantsError) {
        throw assistantsError
      }

      const syncPromises = ((assistants as Assistant[]) || []).map(
        async (assistant): Promise<SyncResult> => {
          try {
            let accessToken = assistant.google_calendar_token

            if (assistant.google_refresh_token) {
              const refreshResponse = await fetch(
                'https://oauth2.googleapis.com/token',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams({
                    client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
                    client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
                    refresh_token: assistant.google_refresh_token,
                    grant_type: 'refresh_token',
                  }),
                },
              )

              const refreshData = await refreshResponse.json()
              if (refreshData.access_token) {
                accessToken = refreshData.access_token

                await supabaseClient
                  .from('assistants')
                  .update({ google_calendar_token: accessToken })
                  .eq('id', assistant.id)
              }
            }

            const calendarEvent = {
              summary: eventData.title,
              description: eventData.description || '',
              start: {
                dateTime: `${eventData.event_date}T${eventData.start_time || '09:00'}:00`,
                timeZone: 'America/Sao_Paulo',
              },
              end: {
                dateTime: `${eventData.event_date}T${eventData.end_time || '18:00'}:00`,
                timeZone: 'America/Sao_Paulo',
              },
              location: eventData.location || '',
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: 30 },
                  { method: 'email', minutes: 1440 },
                ],
              },
            }

            const calendarResponse = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(calendarEvent),
              },
            )

            if (!calendarResponse.ok) {
              throw new Error(`Calendar API error: ${calendarResponse.status}`)
            }

            const calendarEventData = await calendarResponse.json()

            await supabaseClient.from('assistant_calendar_events').insert({
              assistant_id: assistant.id,
              event_id: eventId,
              google_event_id: calendarEventData.id,
              synced_at: new Date().toISOString(),
            })

            return {
              assistantId: assistant.id,
              success: true,
              eventId: calendarEventData.id,
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error'
            return {
              assistantId: assistant.id,
              success: false,
              error: errorMessage,
            }
          }
        },
      )

      const results = await Promise.all(syncPromises)

      return new Response(
        JSON.stringify({
          success: true,
          results,
          message: `Calendar sync completed for ${results.filter((r) => r.success).length} assistants`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
