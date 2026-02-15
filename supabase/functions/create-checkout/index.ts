import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface CheckoutRequest {
    plan_type: "basic" | "pro" | "enterprise";
    user_id: string;
}

const PLAN_PRICES = {
    basic: 49.90,
    pro: 99.90,
    enterprise: 199.90,
};

const PLAN_NAMES = {
    basic: "Plano BASIC",
    pro: "Plano PRO",
    enterprise: "Plano ENTERPRISE",
};

serve(async (req) => {
    // CORS
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    try {
        if (!MP_ACCESS_TOKEN) {
            throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
        }

        const { plan_type, user_id }: CheckoutRequest = await req.json();

        if (!plan_type || !user_id) {
            throw new Error("Missing required fields: plan_type, user_id");
        }

        if (!PLAN_PRICES[plan_type]) {
            throw new Error(`Invalid plan_type: ${plan_type}`);
        }

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

        // Get user data
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
        if (userError) throw userError;

        const userEmail = userData.user.email!;
        const userName = userData.user.user_metadata?.full_name || userEmail.split('@')[0];

        // Create Mercado Pago preference
        const preference = {
            items: [
                {
                    id: `plan_${plan_type}`,
                    title: `${PLAN_NAMES[plan_type]} - Khaos Kontrol`,
                    description: "Assinatura mensal - Acesso completo à plataforma de gestão profissional",
                    category_id: "services",
                    quantity: 1,
                    unit_price: PLAN_PRICES[plan_type],
                    currency_id: "BRL",
                },
            ],
            payer: {
                name: userName,
                email: userEmail,
            },
            back_urls: {
                success: `${req.headers.get("origin")}/upgrade/success`,
                failure: `${req.headers.get("origin")}/upgrade/failure`,
                pending: `${req.headers.get("origin")}/upgrade/pending`,
            },
            auto_return: "approved",
            external_reference: user_id, // To identify user in webhook
            notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
            statement_descriptor: "KHAOS KONTROL",
            metadata: {
                user_id,
                plan_type,
                platform: "khaos_kontrol",
            },
            payment_methods: {
                excluded_payment_types: [],
                excluded_payment_methods: [],
                installments: 12, // Allow up to 12 installments
            },
            expires: true,
            expiration_date_from: new Date().toISOString(),
            expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h expiry
        };

        // Create preference in Mercado Pago
        const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
            },
            body: JSON.stringify(preference),
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error("Mercado Pago error:", mpData);
            throw new Error(mpData.message || "Failed to create checkout preference");
        }

        // Log checkout creation
        await supabase.from("payments").insert({
            user_id,
            amount: PLAN_PRICES[plan_type],
            currency: "BRL",
            status: "pending",
            mp_preference_id: mpData.id,
            payment_type: "subscription",
            description: `${PLAN_NAMES[plan_type]} - Checkout criado`,
            metadata: { plan_type },
        });

        return new Response(
            JSON.stringify({
                success: true,
                checkout_url: mpData.init_point, // URL to redirect user
                preference_id: mpData.id,
                sandbox_url: mpData.sandbox_init_point, // For testing
            }),
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                }
            }
        );
    } catch (error: any) {
        console.error("Checkout creation error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                }
            }
        );
    }
});
