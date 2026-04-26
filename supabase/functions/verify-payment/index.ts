import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Stripe } from 'https://esm.sh/stripe?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'
import { logEdgeError } from '../_shared/log-error.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

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
    const { sessionId } = await req.json()

    if (!sessionId) {
      throw new Error('Session ID is required')
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({
          status: session.payment_status,
          message: 'Payment not completed',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    const userId = session.client_reference_id
    const planName = session.metadata?.plan_name

    if (!userId) {
      throw new Error('No user linked to this reference')
    }

    let planType = 'professional'
    if (planName === 'Essencial') planType = 'essential'
    if (planName === 'Studio') planType = 'studio'

    const { error: updateError } = await supabase
      .from('makeup_artists')
      .update({
        plan_type: planType,
        plan_status: 'active',
        stripe_subscription_id: (session.subscription as string) || null,
      })
      .eq('user_id', userId)

    if (updateError) {
      throw new Error('Failed to update user profile')
    }

    const customerId = session.customer as string | undefined

    if (customerId && userId) {
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        plan: planType,
        plan_type: planType,
        subscription_status: 'active',
      })
      .eq('id', userId)

    if (profileUpdateError) {
    }

    return new Response(
      JSON.stringify({
        success: true,
        plan: planType,
        message: 'Plan activated successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    await logEdgeError('verify-payment', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
