import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

type ResendEvent = {
  type: string
  created_at: string
  data: {
    email_id?: string
    to?: string[] | string
    from?: string
    subject?: string
    bounce?: { type?: string; message?: string }
    complaint?: { type?: string }
  }
}

const SUPPRESS_EVENTS = new Set([
  'email.bounced',
  'email.complained',
])

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const event = (await req.json()) as ResendEvent
    if (!event?.type || !event?.data) return json({ error: 'Invalid event' }, 400)

    const recipients = Array.isArray(event.data.to)
      ? event.data.to
      : event.data.to
        ? [event.data.to]
        : []

    for (const recipient of recipients) {
      await supabase.from('email_events').insert({
        email_id: event.data.email_id ?? null,
        recipient,
        event_type: event.type,
        metadata: event.data as unknown as Record<string, unknown>,
      })

      if (SUPPRESS_EVENTS.has(event.type)) {
        await supabase
          .from('email_suppressions')
          .upsert(
            {
              email: recipient,
              reason: event.type,
              resend_event_id: event.data.email_id ?? null,
              metadata: event.data as unknown as Record<string, unknown>,
            },
            { onConflict: 'email' },
          )
      }
    }

    return json({ received: true, count: recipients.length })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return json({ error: msg }, 500)
  }
})
