import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.11.0'
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts'
import { logEdgeError } from '../_shared/log-error.ts'

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
    const {
      plan_type,
      user_id,
      success_url,
      cancel_url,
      cycle,
    } = await req.json()

    if (!plan_type || !user_id) {
      throw new Error('Missing plan_type or user_id')
    }
    const billingCycle: 'monthly' | 'annual' =
      cycle === 'annual' ? 'annual' : 'monthly'

    const origin = req.headers.get('origin') ?? 'https://khaoskontrol.com.br'
    const successUrl =
      success_url ?? `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = cancel_url ?? `${origin}/planos`

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // plan_configs foi dropada no orphan cleanup de 20/04. plan_limits é
    // a canônica agora; coluna stripe_price_id adicionada na migration
    // 20260425000001.
    const { data: planConfig, error: planError } = await supabase
      .from('plan_limits')
      .select('plan_type, stripe_price_id, stripe_price_id_yearly')
      .eq('plan_type', plan_type)
      .single()

    if (planError || !planConfig) {
      throw new Error(`Plan not found: ${plan_type}`)
    }

    const priceId =
      billingCycle === 'annual'
        ? planConfig.stripe_price_id_yearly
        : planConfig.stripe_price_id

    if (!priceId) {
      throw new Error(
        `Plan ${plan_type} has no ${billingCycle} price configured.`,
      )
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

    // Hosted mode (Stripe-hosted page). Caller redireciona pra session.url
    // depois recebe usuário no success_url. Mais simples que embedded e
    // já alinha com usePlanAccess.createCheckoutSession.onSuccess que usa
    // window.location.href = data.url.
    // Promo codes: usa o sistema de Promotion Codes do Stripe Dashboard.
    // Crie códigos via `stripe coupons create` + `stripe promotion_codes
    // create --code WELCOME10 --coupon=...`. Aí o user digita no checkout.
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      client_reference_id: user_id,
      metadata: {
        user_id,
        plan_type,
        cycle: billingCycle,
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
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    await logEdgeError('create-checkout-session', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
