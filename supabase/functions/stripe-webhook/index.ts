import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature");
    const body = await req.text();

    if (!signature) {
        return new Response("No signature header", { status: 400 });
    }

    let event;
    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "",
            undefined,
            cryptoProvider
        );
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(err.message, { status: 400 });
    }

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const projectId = session.client_reference_id; // This is User ID for subscriptions

                if (session.mode === 'subscription' && projectId) {
                    const subscriptionId = session.subscription as string;
                    const customerId = session.customer as string;

                    // Determine Plan Type from Price ID logic or metadata
                    // Better approach: fetch subscription items, but for now we map known IDs or default to 'pro'
                    // In a real scenario, we should fetch the subscription to get the price ID.
                    let planType = 'pro';
                    try {
                        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                        const priceId = subscription.items.data[0]?.price.id;

                        if (priceId === 'price_1T06IGPuhubKL3n8c8sTgvsu') planType = 'basic';
                        else if (priceId === 'price_1T06JHPuhubKL3n88FuAacvY') planType = 'pro';
                        else if (priceId === 'price_1T06JePuhubKL3n8AEQBTYtV') planType = 'enterprise';
                    } catch (e) {
                        console.error("Failed to fetch subscription details, defaulting to pro:", e);
                    }

                    // Update user profile with Stripe Customer ID
                    await supabase.from("profiles")
                        .update({ stripe_customer_id: customerId })
                        .eq("id", projectId);

                    // Create/Update Subscription in our DB
                    const { error: subError } = await supabase.from("subscriptions").upsert({
                        user_id: projectId,
                        stripe_subscription_id: subscriptionId,
                        stripe_customer_id: customerId,
                        status: 'active',
                        plan_type: planType,
                        current_period_end: new Date(session.expires_at ? session.expires_at * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    }, { onConflict: 'user_id' });

                    if (subError) console.error('Subscription upsert failed:', subError);
                    else console.log(`Subscription created for user ${projectId} with plan ${planType}`);

                } else if (projectId) {
                    // One-time payment logic (legacy or unrelated)
                    const { error } = await supabase.from("projects")
                        .update({ status: "confirmed", payment_status: "paid" })
                        .eq("id", projectId);
                    if (error) console.error('Project update failed', error);
                }
                break;
            }

            case "invoice.paid": {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = invoice.subscription as string;

                if (subscriptionId) {
                    // Find user by stripe_customer_id or subscription_id
                    const { data: subData } = await supabase
                        .from("subscriptions")
                        .select("user_id")
                        .eq("stripe_subscription_id", subscriptionId)
                        .single();

                    if (subData) {
                        // Update next billing date
                        const nextPayment = invoice.lines.data[0].period.end;

                        await supabase.from("subscriptions")
                            .update({
                                status: 'active',
                                current_period_end: new Date(nextPayment * 1000).toISOString(),
                                updated_at: new Date().toISOString()
                            })
                            .eq("stripe_subscription_id", subscriptionId);

                        console.log(`Subscription ${subscriptionId} renewed until ${new Date(nextPayment * 1000).toISOString()}`);
                    } else {
                        console.warn(`Subscription ${subscriptionId} not found in DB`);
                    }
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                await supabase.from("subscriptions")
                    .update({ status: 'cancelled' })
                    .eq("stripe_subscription_id", subscription.id);
                console.log(`Subscription ${subscription.id} cancelled`);
                break;
            }
        }
    } catch (err) {
        console.error(`Error processing event ${event.type}:`, err);
        return new Response("Internal Server Error", { status: 500 });
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
    });
});
