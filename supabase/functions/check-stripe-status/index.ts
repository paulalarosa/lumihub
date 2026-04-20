import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const start = Date.now()
  try {
    const key = Deno.env.get('STRIPE_SECRET_KEY')
    if (!key) {
      return json({ status: 'not_configured', error: 'STRIPE_SECRET_KEY missing' }, 200)
    }

    const stripe = new Stripe(key, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // balance.retrieve requires minimal scope and works on any Stripe account
    // (regular or Connect). Much more reliable than accounts.retrieve.
    await stripe.balance.retrieve()

    return json({
      status: 'operational',
      latency: `${Date.now() - start}ms`,
      mode: key.startsWith('sk_test_') ? 'test' : 'live',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return json({ status: 'down', error: msg }, 200)
  }
})
