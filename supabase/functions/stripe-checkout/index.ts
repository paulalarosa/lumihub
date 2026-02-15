import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.11.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2023-10-16",
});

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { plan_type, user_id } = await req.json();

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // 1. Buscar configuração do plano
        const { data: planConfig, error: planError } = await supabase
            .from("plan_configs")
            .select("*")
            .eq("plan_type", plan_type)
            .single();

        if (planError || !planConfig) {
            throw new Error("Plano não encontrado");
        }

        // 2. Buscar ou criar customer no Stripe
        const { data: artist } = await supabase
            .from("makeup_artists")
            .select("*, profile:profiles(email)")
            .eq("user_id", user_id)
            .single();

        if (!artist) {
            throw new Error("Artista não encontrado");
        }

        let customerId = artist.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: artist.profile?.email || artist.email, // Fallback to artist.email if profile email is missing
                metadata: {
                    supabase_user_id: user_id,
                    khaos_artist_id: artist.id,
                },
            });
            customerId = customer.id;

            // Salvar customer_id
            await supabase
                .from("makeup_artists")
                .update({ stripe_customer_id: customerId })
                .eq("user_id", user_id);
        }

        // 3. Criar Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            line_items: [
                {
                    price: planConfig.stripe_price_id,
                    quantity: 1,
                },
            ],
            success_url: `${req.headers.get("origin")}/dashboard?checkout=success`,
            cancel_url: `${req.headers.get("origin")}/pricing?checkout=cancelled`,
            metadata: {
                user_id,
                plan_type,
            },
            subscription_data: {
                metadata: {
                    user_id,
                    plan_type,
                },
                trial_period_days: artist.plan_status === "trialing" ? 0 : 14,
            },
        });

        return new Response(
            JSON.stringify({ url: session.url }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("Checkout error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
