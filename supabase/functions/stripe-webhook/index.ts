import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.11.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2023-10-16",
});

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

serve(async (req) => {
    const signature = req.headers.get("stripe-signature")!;
    const body = await req.text();

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }

    console.log("Event type:", event.type);

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            }

            case "customer.subscription.created":
            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdate(subscription);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionCancelled(subscription);
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentSucceeded(invoice);
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentFailed(invoice);
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (error: any) {
        console.error("Webhook handler error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.user_id;
    const planType = session.metadata?.plan_type;

    if (!userId) return;

    await supabase
        .from("makeup_artists")
        .update({
            stripe_subscription_id: session.subscription as string,
            plan_type: planType,
            plan_status: "active",
            plan_started_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

    console.log(`Subscription activated for user ${userId}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.user_id;

    if (!userId) {
        // Buscar pelo subscription_id
        const { data: artist } = await supabase
            .from("makeup_artists")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

        if (!artist) return;

        // update status
        const status = mapStripeStatus(subscription.status);

        await supabase
            .from("makeup_artists")
            .update({
                plan_status: status,
                plan_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("user_id", artist.user_id);
    } else {
        const status = mapStripeStatus(subscription.status);

        await supabase
            .from("makeup_artists")
            .update({
                plan_status: status,
                plan_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("user_id", userId);
    }
}

function mapStripeStatus(stripeStatus: string): string {
    switch (stripeStatus) {
        case 'active': return 'active';
        case 'trialing': return 'trialing';
        case 'past_due': return 'past_due';
        case 'canceled': return 'cancelled';
        case 'paused': return 'paused';
        default: return 'paused';
    }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
    await supabase
        .from("makeup_artists")
        .update({
            plan_status: "cancelled",
        })
        .eq("stripe_subscription_id", subscription.id);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    // Buscar user_id pelo customer_id
    const { data: artist } = await supabase
        .from("makeup_artists")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

    if (!artist) return;

    // Registrar pagamento
    await supabase.from("payment_history").insert({
        user_id: artist.user_id,
        stripe_payment_intent_id: invoice.payment_intent as string,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: "succeeded",
        description: `Pagamento ${invoice.billing_reason}`,
        paid_at: new Date(invoice.created * 1000).toISOString(),
    });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const { data: artist } = await supabase
        .from("makeup_artists")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

    if (!artist) return;

    // Registrar falha
    await supabase.from("payment_history").insert({
        user_id: artist.user_id,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        status: "failed",
        description: `Falha no pagamento: ${invoice.billing_reason}`,
    });

    // Atualizar status do plano
    await supabase
        .from("makeup_artists")
        .update({ plan_status: "past_due" })
        .eq("user_id", artist.user_id);
}
