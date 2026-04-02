import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const BATCH_SIZE = 10
const BATCH_DELAY_MS = 1000

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No auth header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { campaign_id } = await req.json()

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('marketing_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (campaign.status !== 'draft') {
      return new Response(
        JSON.stringify({ error: 'Campaign already sent or in progress' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    await supabaseAdmin
      .from('marketing_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaign_id)

    const { data: recipients, error: recipientsError } =
      await supabaseAdmin.rpc('get_campaign_recipients', {
        p_campaign_id: campaign_id,
      })

    if (recipientsError) throw recipientsError

    if (!recipients || recipients.length === 0) {
      await supabaseAdmin
        .from('marketing_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          total_sent: 0,
        })
        .eq('id', campaign_id)

      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let totalSent = 0
    const batches = []
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      batches.push(recipients.slice(i, i + BATCH_SIZE))
    }

    for (const batch of batches) {
      const promises = batch.map(
        async (recipient: { email: string; full_name: string }) => {
          try {
            const personalizedHtml = campaign.body_html.replace(
              /\{\{nome\}\}/g,
              recipient.full_name || 'Cliente',
            )

            const { error: invokeError } = await supabaseAdmin.functions.invoke(
              'send-ses-email',
              {
                body: {
                  to: recipient.email,
                  subject: campaign.subject,
                  html: personalizedHtml,
                },
              },
            )

            if (!invokeError) {
              totalSent++
            }
          } catch (_e) {}
        },
      )

      await Promise.allSettled(promises)

      await supabaseAdmin
        .from('marketing_campaigns')
        .update({ total_sent: totalSent })
        .eq('id', campaign_id)

      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
      }
    }

    await supabaseAdmin
      .from('marketing_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        total_sent: totalSent,
      })
      .eq('id', campaign_id)

    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      table_name: 'marketing_campaigns',
      record_id: campaign_id,
      action: 'CAMPAIGN_SENT',
      new_data: { total_sent: totalSent, total_recipients: recipients.length },
      source: 'edge_function',
    })

    return new Response(
      JSON.stringify({
        success: true,
        sent: totalSent,
        total: recipients.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
