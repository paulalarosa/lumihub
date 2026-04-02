import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    const bodyText = await req.text()
    let body
    try {
      body = JSON.parse(bodyText)
    } catch (e) {
      return new Response('Invalid JSON', { status: 400 })
    }

    const messageType = req.headers.get('x-amz-sns-message-type') || body.Type

    if (messageType === 'SubscriptionConfirmation') {
      const subscribeUrl = body.SubscribeURL

      const confirmResponse = await fetch(subscribeUrl)
      if (confirmResponse.ok) {
        return new Response('Subscription Confirmed', { status: 200 })
      } else {
        return new Response('Confirmation Failed', { status: 500 })
      }
    }

    if (messageType === 'Notification') {
      const message =
        typeof body.Message === 'string'
          ? JSON.parse(body.Message)
          : body.Message
      const notificationType = message.notificationType

      if (notificationType === 'Bounce' || notificationType === 'Complaint') {
        const recipients =
          notificationType === 'Bounce'
            ? message.bounce.bouncedRecipients
            : message.complaint.complainedRecipients

        const status =
          notificationType === 'Bounce' ? 'invalid' : 'unsubscribed'

        for (const recipient of recipients) {
          const email = recipient.emailAddress

          await supabase
            .from('profiles')
            .update({ email_status: status })
            .eq('email', email)

          await supabase
            .from('wedding_clients')
            .update({ email_status: status })
            .eq('email', email)

          await supabase
            .from('leads')
            .update({ email_status: status })
            .eq('email', email)

          await supabase
            .from('assistant_invites')
            .update({ email_status: status })
            .eq('assistant_email', email)

          await supabase.from('notification_logs').insert({
            notification_id: null,
            status: 'error',
            error_message: `SES ${notificationType}: ${email} marked as ${status}`,
          })
        }
      }

      return new Response('Notification Processed', { status: 200 })
    }

    return new Response('Message type not handled', { status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
