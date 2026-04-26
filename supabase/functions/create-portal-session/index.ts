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
  const limit = checkRateLimit(`portal:${clientIp}`, {
    maxRequests: 5,
    windowMs: 60_000,
  })
  if (!limit.allowed) return rateLimitResponse(limit.resetAt)

  try {
    const { user_id, return_url } = await req.json()
    if (!user_id) throw new Error('Missing user_id')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // stripe_customer_id pode vir de profiles ou makeup_artists — checkout
    // session.create grava nas duas tabelas (em sucesso). Tenta artist
    // primeiro (canônico pra billing).
    const { data: artist } = await supabase
      .from('makeup_artists')
      .select('stripe_customer_id')
      .eq('user_id', user_id)
      .maybeSingle()

    let customerId = artist?.stripe_customer_id

    if (!customerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user_id)
        .maybeSingle()
      customerId = profile?.stripe_customer_id
    }

    if (!customerId) {
      throw new Error(
        'Você ainda não tem um cliente Stripe. Faça uma assinatura primeiro.',
      )
    }

    const origin =
      req.headers.get('origin') ?? 'https://khaoskontrol.com.br'

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url ?? `${origin}/configuracoes/assinatura`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    await logEdgeError('create-portal-session', error)
    const msg = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
