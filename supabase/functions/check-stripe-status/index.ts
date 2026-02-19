import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

serve(async (req) => {
    const start = Date.now();
    try {
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
            apiVersion: '2022-11-15',
            httpClient: Stripe.createFetchHttpClient(),
        });

        // Teste leve: apenas recupera as informações da conta
        await stripe.accounts.retrieve();

        const latency = Date.now() - start;
        return new Response(JSON.stringify({ status: 'operational', latency: `${latency}ms` }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ status: 'down', error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
})
