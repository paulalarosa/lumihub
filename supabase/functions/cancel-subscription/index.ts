import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Stripe } from 'https://esm.sh/stripe?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'
import { logEdgeError } from '../_shared/log-error.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) throw new Error('Invalid token')

    const userId = userData.user.id
    const { action = 'cancel_at_period_end' } = await req.json().catch(() => ({}))

    const { data: artist, error: artistError } = await supabase
      .from('makeup_artists')
      .select('stripe_subscription_id, plan_status')
      .eq('user_id', userId)
      .maybeSingle()

    if (artistError) throw artistError
    if (!artist?.stripe_subscription_id) {
      throw new Error('No active subscription to cancel')
    }

    let updatedSubscription
    if (action === 'cancel_immediately') {
      updatedSubscription = await stripe.subscriptions.cancel(
        artist.stripe_subscription_id,
      )
      await supabase
        .from('makeup_artists')
        .update({ plan_status: 'cancelled' })
        .eq('user_id', userId)
    } else if (action === 'reactivate') {
      updatedSubscription = await stripe.subscriptions.update(
        artist.stripe_subscription_id,
        { cancel_at_period_end: false },
      )
      await supabase
        .from('makeup_artists')
        .update({ plan_status: 'active' })
        .eq('user_id', userId)
    } else {
      updatedSubscription = await stripe.subscriptions.update(
        artist.stripe_subscription_id,
        { cancel_at_period_end: true },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: updatedSubscription.id,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        current_period_end: updatedSubscription.current_period_end,
        status: updatedSubscription.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    await logEdgeError('cancel-subscription', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
