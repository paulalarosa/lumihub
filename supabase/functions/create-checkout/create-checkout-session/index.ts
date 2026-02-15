import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { priceId, userId, planName } = await req.json();

        if (!priceId) {
            throw new Error("Price ID is required");
        }

        console.log(`Creating checkout session for user ${userId} with plan ${planName}`);

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            client_reference_id: userId, // CRITICAL: Link session to user
            metadata: {
                plan_name: planName || 'unknown', // Store plan name for verification
            },
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            return_url: `${req.headers.get("origin")}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        });

        return new Response(
            JSON.stringify({ clientSecret: session.client_secret }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
