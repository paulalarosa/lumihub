import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.11.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancelled(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const clientReferenceId = session.client_reference_id
  const userId = clientReferenceId || session.metadata?.user_id

  if (!userId) return

  const planType = session.metadata?.plan_type || 'profissional'
  const stripeCustomerId = session.customer as string | null
  const stripeSubscriptionId = session.subscription as string | null

  await supabase
    .from('profiles')
    .update({
      plan: planType,
      stripe_customer_id: stripeCustomerId,
    })
    .eq('id', userId)

  await supabase
    .from('makeup_artists')
    .update({
      stripe_subscription_id: stripeSubscriptionId,
      plan_type: planType,
      plan_status: 'active',
      plan_started_at: new Date().toISOString(),
      stripe_customer_id: stripeCustomerId,
    })
    .eq('user_id', userId)

  // For one-time payments (mode='payment'), invoice.payment_succeeded
  // isn't fired — create the invoice record here.
  if (session.mode === 'payment' && session.amount_total) {
    const amount = session.amount_total / 100
    const stripeRef = (session.payment_intent as string | null) ?? session.id

    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', stripeRef)
      .eq('user_id', userId)
      .maybeSingle()

    if (!existing) {
      await supabase.from('invoices').insert({
        user_id: userId,
        invoice_number: stripeRef,
        amount,
        status: session.payment_status === 'paid' ? 'paid' : 'pending',
        paid_at:
          session.payment_status === 'paid'
            ? new Date().toISOString()
            : null,
      })
    }
  }

  // Audit trail (survives webhook retries; invoice_paid already triggers workflows)
  await supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      table_name: 'subscriptions',
      record_id: stripeSubscriptionId ?? session.id,
      action: 'CHECKOUT_COMPLETED',
      new_data: {
        plan_type: planType,
        mode: session.mode,
        amount_total: session.amount_total,
        payment_status: session.payment_status,
      },
      source: 'stripe_webhook',
    })
    .then(() => undefined, () => undefined)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    const { data: artist } = await supabase
      .from('makeup_artists')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (!artist) return

    const status = mapStripeStatus(subscription.status)

    await supabase
      .from('makeup_artists')
      .update({
        plan_status: status,
        plan_expires_at: new Date(
          subscription.current_period_end * 1000,
        ).toISOString(),
      })
      .eq('user_id', artist.user_id)
  } else {
    const status = mapStripeStatus(subscription.status)

    await supabase
      .from('makeup_artists')
      .update({
        plan_status: status,
        plan_expires_at: new Date(
          subscription.current_period_end * 1000,
        ).toISOString(),
      })
      .eq('user_id', userId)
  }
}

function mapStripeStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'canceled':
      return 'cancelled'
    case 'paused':
      return 'paused'
    default:
      return 'paused'
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  await supabase
    .from('makeup_artists')
    .update({
      plan_status: 'cancelled',
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function findUserByCustomer(customerId: string) {
  const { data: artist } = await supabase
    .from('makeup_artists')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()
  return artist?.user_id ?? null
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const userId = await findUserByCustomer(invoice.customer as string)
  if (!userId) return

  const amount = invoice.amount_paid / 100
  const stripeInvoiceId = invoice.id
  const paidAt = new Date((invoice.status_transitions?.paid_at ?? invoice.created) * 1000).toISOString()

  // Upsert by stripe invoice id so this handler is idempotent (Stripe may retry)
  const { data: existing } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('invoice_number', stripeInvoiceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    if (existing.status !== 'paid') {
      await supabase
        .from('invoices')
        .update({ status: 'paid', paid_at: paidAt, amount })
        .eq('id', existing.id)
    }
  } else {
    await supabase.from('invoices').insert({
      user_id: userId,
      invoice_number: stripeInvoiceId,
      amount,
      status: 'paid',
      paid_at: paidAt,
      due_date: invoice.due_date
        ? new Date(invoice.due_date * 1000).toISOString()
        : null,
    })
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const userId = await findUserByCustomer(invoice.customer as string)
  if (!userId) return

  const amount = invoice.amount_due / 100
  const stripeInvoiceId = invoice.id

  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('invoice_number', stripeInvoiceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('invoices')
      .update({ status: 'overdue' })
      .eq('id', existing.id)
  } else {
    await supabase.from('invoices').insert({
      user_id: userId,
      invoice_number: stripeInvoiceId,
      amount,
      status: 'overdue',
      due_date: invoice.due_date
        ? new Date(invoice.due_date * 1000).toISOString()
        : null,
    })
  }

  await supabase
    .from('makeup_artists')
    .update({ plan_status: 'past_due' })
    .eq('user_id', userId)
}
