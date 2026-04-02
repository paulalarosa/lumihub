import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  SESClient,
  SendTemplatedEmailCommand,
} from 'https://esm.sh/@aws-sdk/client-ses@3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID')
const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY')
const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1'
const SES_SOURCE_EMAIL =
  Deno.env.get('SES_SOURCE_EMAIL') || 'noreply@khaoskontrol.com.br'

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

    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString()

    const { data: abandonedPayments, error: fetchError } = await supabase
      .from('payments')
      .select('*, user_id')
      .eq('status', 'pending')
      .gt('created_at', twentyFourHoursAgo)
      .lt('created_at', oneHourAgo)

    if (fetchError) throw fetchError
    if (!abandonedPayments || abandonedPayments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No abandoned carts found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    const sesClient = new SESClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID!,
        secretAccessKey: AWS_SECRET_ACCESS_KEY!,
      },
    })

    const results = []

    for (const payment of abandonedPayments) {
      const { data: userData } = await supabase.auth.admin.getUserById(
        payment.user_id,
      )
      if (!userData?.user?.email) continue

      const userEmail = userData.user.email

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email_status')
          .eq('email', userEmail)
          .maybeSingle()

        if (
          profile?.email_status === 'invalid' ||
          profile?.email_status === 'unsubscribed'
        ) {
          continue
        }

        const command = new SendTemplatedEmailCommand({
          Source: SES_SOURCE_EMAIL,
          Destination: { ToAddresses: [userData.user.email] },
          Template: 'Khaos_AbandonedCart',
          TemplateData: JSON.stringify({
            name: userData.user.user_metadata?.full_name || 'Cliente',
            plan_name: payment.metadata?.plan_type || 'PRO',
            checkout_url: `https://khaoskontrol.com.br/upgrade`,
          }),
        })

        const sesResponse = await sesClient.send(command)

        results.push({
          email: userData.user.email,
          status: 'sent',
          id: sesResponse.MessageId,
        })

        await supabase
          .from('payments')
          .update({
            metadata: { ...payment.metadata, abandoned_email_sent: true },
          })
          .eq('id', payment.id)
      } catch (err) {
        results.push({
          email: userData.user.email,
          status: 'failed',
          error: err.message,
        })
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
