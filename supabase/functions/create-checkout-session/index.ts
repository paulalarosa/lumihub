import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.11.0'
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
  const limit = checkRateLimit(clientIp, { maxRequests: 5, windowMs: 60000 })
  if (!limit.allowed) {
    return rateLimitResponse(limit.resetAt)
  }

  try {
    const { plan_type, user_id } = await req.json()

    if (!plan_type || !user_id) {
      throw new Error('Missing plan_type or user_id')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: planConfig, error: planError } = await supabase
      .from('plan_configs')
      .select('*')
      .eq('plan_type', plan_type)
      .single()

    if (planError || !planConfig) {
      throw new Error('Plan not found')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', user_id)
      .single()

    let email = profile?.email
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const { data: artist } = await supabase
        .from('makeup_artists')
        .select('stripe_customer_id, email')
        .eq('user_id', user_id)
        .single()

      if (artist) {
        customerId = artist.stripe_customer_id

        if (!email) email = artist.email
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          supabase_user_id: user_id,
        },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user_id)

      await supabase
        .from('makeup_artists')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user_id)
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: planConfig.stripe_price_id,
          quantity: 1,
        },
      ],
      return_url: `${req.headers.get('origin')}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        user_id,
        plan_type,
      },
      subscription_data: {
        metadata: {
          user_id,
          plan_type,
        },
        trial_period_days: 14,
      },
    })

    return new Response(
      JSON.stringify({ clientSecret: session.client_secret }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
