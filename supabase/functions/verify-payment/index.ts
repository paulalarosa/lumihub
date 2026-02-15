import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { sessionId } = await req.json();

        if (!sessionId) {
            throw new Error("Session ID is required");
        }

        // 1. Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            return new Response(
                JSON.stringify({ status: session.payment_status, message: "Payment not completed" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );
        }

        const userId = session.client_reference_id;
        const planName = session.metadata?.plan_name;

        if (!userId) {
            throw new Error("No user linked to this reference");
        }

        // 2. Determine Plan Type
        // If we passed plan_name in metadata, use use it.
        // Otherwise fallback logic (not recommended for production but good for MVP)

        let planType = 'professional'; // Default
        if (planName === 'Essencial') planType = 'essential';
        if (planName === 'Studio') planType = 'studio';

        // 3. Update User in Supabase
        const { error: updateError } = await supabase
            .from('makeup_artists')
            .update({
                plan_type: planType,
                plan_status: 'active',
                stripe_subscription_id: session.subscription as string || null,
                // updated_at: new Date().toISOString() // removed if column doesnt exist, harmless to remove for now
            })
            .eq('user_id', userId);

        if (updateError) {
            console.error("Error updating profile:", updateError);
            throw new Error("Failed to update user profile");
        }

        return new Response(
            JSON.stringify({
                success: true,
                plan: planType,
                message: "Plan activated successfully"
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error) {
        console.error("Verification error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
});
