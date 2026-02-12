import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SESClient, SendTemplatedEmailCommand } from "https://esm.sh/@aws-sdk/client-ses@3";

const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID");
const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY");
const AWS_REGION = Deno.env.get("AWS_REGION") || "us-east-1";
const SES_SOURCE_EMAIL = Deno.env.get("SES_SOURCE_EMAIL") || "noreply@khaoskontrol.com.br";

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
        const body = await req.json();
        console.log("Webhook received:", JSON.stringify(body, null, 2));

        // Mercado Pago sends notifications for different events
        if (body.type === "payment") {
            const paymentId = body.data.id;

            // Fetch payment details from Mercado Pago
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
                },
            });

            const payment = await mpResponse.json();
            console.log("Payment details:", JSON.stringify(payment, null, 2));

            if (payment.status === "approved") {
                const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
                const userId = payment.external_reference;
                const planType = payment.metadata?.plan_type || "pro";

                // 1. Create or update subscription
                const { data: subscription, error: subError } = await supabase
                    .from("subscriptions")
                    .upsert({
                        user_id: userId,
                        plan_type: planType,
                        status: "active",
                        price_monthly: payment.transaction_amount,
                        mp_subscription_id: payment.id,
                        mp_payer_id: payment.payer.id,
                        mp_preference_id: payment.metadata?.preference_id,
                        current_period_start: new Date().toISOString(),
                        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    }, {
                        onConflict: "user_id",
                    })
                    .select()
                    .single();

                if (subError) {
                    console.error("Subscription upsert error:", subError);
                    throw subError;
                }

                console.log("Subscription created/updated:", subscription);

                // 2. Record payment
                const { error: paymentError } = await supabase.from("payments").insert({
                    subscription_id: subscription.id,
                    user_id: userId,
                    amount: payment.transaction_amount,
                    currency: payment.currency_id,
                    status: "approved",
                    mp_payment_id: payment.id,
                    mp_preference_id: payment.metadata?.preference_id,
                    payment_method: payment.payment_method_id,
                    payment_type: "subscription",
                    description: `Pagamento aprovado - ${planType.toUpperCase()}`,
                    metadata: {
                        payer_email: payment.payer.email,
                        payment_type: payment.payment_type_id,
                        installments: payment.installments,
                    },
                    paid_at: new Date().toISOString(),
                });

                if (paymentError) {
                    console.error("Payment insert error:", paymentError);
                    throw paymentError;
                }

                // 3. Upgrade assistant to full user
                const { data: assistant } = await supabase
                    .from("assistants")
                    .select("id")
                    .eq("user_id", userId)
                    .maybeSingle();

                if (assistant) {
                    await supabase
                        .from("assistants")
                        .update({
                            is_upgraded: true,
                            upgraded_at: new Date().toISOString(),
                        })
                        .eq("user_id", userId);

                    console.log("Assistant upgraded to full user");
                }

                // 4. Create or update makeup_artist profile
                const { error: maError } = await supabase.from("makeup_artists").upsert({
                    user_id: userId,
                    plan_type: planType,
                    subscription_status: "active",
                }, {
                    onConflict: "user_id",
                });

                if (maError) {
                    console.error("Makeup artist upsert error:", maError);
                } else {
                    console.log("Makeup artist profile created/updated");
                }

                // 5. Update user metadata
                await supabase.auth.admin.updateUserById(userId, {
                    user_metadata: {
                        subscription_status: "active",
                        plan_type: planType,
                    },
                });

                console.log("Payment processed successfully");

                // 6. Send Order Confirmation Email via AWS SES
                if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && payment.payer.email) {
                    try {
                        const sesClient = new SESClient({
                            region: AWS_REGION,
                            credentials: {
                                accessKeyId: AWS_ACCESS_KEY_ID,
                                secretAccessKey: AWS_SECRET_ACCESS_KEY,
                            },
                        });

                        // Check if email is valid/subscribed
                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("email_status")
                            .eq("email", payment.payer.email)
                            .maybeSingle();

                        if (profile?.email_status === 'invalid' || profile?.email_status === 'unsubscribed') {
                            console.log(`Skipping email to ${payment.payer.email} due to status: ${profile.email_status}`);
                        } else {
                            const command = new SendTemplatedEmailCommand({
                                Source: SES_SOURCE_EMAIL,
                                Destination: {
                                    ToAddresses: [payment.payer.email],
                                },
                                Template: "Khaos_OrderConfirmed",
                                TemplateData: JSON.stringify({
                                    name: payment.card?.cardholder?.name || "Cliente",
                                    order_id: payment.id,
                                    plan_name: planType.toUpperCase(),
                                    amount: payment.transaction_amount,
                                    date: new Date().toLocaleDateString('pt-BR')
                                }),
                            });

                            const sesResponse = await sesClient.send(command);
                            console.log("Order confirmation email sent:", sesResponse.MessageId);

                            // Log notification
                            await supabase.from("notification_logs").insert({
                                user_id: userId,
                                type: "email",
                                recipient: payment.payer.email,
                                status: "sent",
                                provider_id: sesResponse.MessageId,
                                metadata: {
                                    template: "Khaos_OrderConfirmed",
                                    provider: "aws-ses"
                                }
                            });
                        }

                    } catch (sesError) {
                        console.error("Failed to send SES email:", sesError);
                        // Don't fail the webhook if email fails, just log it
                        await supabase.from("notification_logs").insert({
                            user_id: userId,
                            type: "email",
                            recipient: payment.payer.email,
                            status: "failed",
                            error_message: sesError.message,
                            metadata: {
                                template: "Khaos_OrderConfirmed",
                                provider: "aws-ses"
                            }
                        });
                    }
                }

            } else if (payment.status === "rejected" || payment.status === "cancelled") {
                // Handle failed payments
                const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
                const userId = payment.external_reference;

                await supabase.from("payments").insert({
                    user_id: userId,
                    amount: payment.transaction_amount,
                    currency: payment.currency_id,
                    status: payment.status,
                    mp_payment_id: payment.id,
                    payment_method: payment.payment_method_id,
                    payment_type: "subscription",
                    description: `Pagamento ${payment.status} - ${payment.status_detail}`,
                    metadata: {
                        status_detail: payment.status_detail,
                        payer_email: payment.payer.email,
                    },
                });

                console.log(`Payment ${payment.status}:`, payment.status_detail);
            }
        }

        return new Response(
            JSON.stringify({ success: true, received: true }),
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                }
            }
        );
    } catch (error: any) {
        console.error("Webhook processing error:", error);
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
