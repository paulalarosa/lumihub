// This file represents the logic that would run in a Supabase Edge Function
// for handling Stripe Webhooks.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('CRITICAL: Missing Supabase credentials in billing webhook');
    // We don't throw here to avoid crashing the module load, but handleBillingWebhook will fail or we create a dummy client
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

interface StripeCheckoutObject {
    metadata: { user_id?: string };
    subscription?: string;
    customer?: string;
    id?: string;
}

interface StripeEvent {
    type: string;
    data: {
        object: StripeCheckoutObject;
    };
}

export const handleBillingWebhook = async (event: StripeEvent) => {
    const { type, data } = event;
    const object = data.object;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Audit Log Failed: Missing credentials');
        return { received: false, error: 'Configuration Error' };
    }

    switch (type) {
        case 'checkout.session.completed': {
            const userId = object.metadata.user_id;
            const subscriptionId = object.subscription;

            // 1. Update Profile Plan
            await supabase
                .from('profiles')
                .update({
                    plan: 'pro',
                    stripe_customer_id: object.customer,
                    stripe_subscription_id: subscriptionId
                })
                .eq('id', userId);

            // 2. Log Audit Action (Financial Traceability)
            const { error: auditError } = await supabase.from('audit_logs').insert({
                user_id: userId,
                table_name: 'profiles',
                record_id: userId || '00000000-0000-0000-0000-000000000000',
                action: 'SUBSCRIPTION_UPDATE',
                source: 'STRIPE_WEBHOOK',
                new_data: {
                    plan: 'pro',
                    stripe_customer_id: object.customer,
                    subscription_id: subscriptionId,
                    event_id: object.id
                },
                created_at: new Date().toISOString()
            });

            if (auditError) {
                console.error('AUDIT LOG FAILED:', auditError);
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscriptionId = object.id;

            // Downgrade user
            // First find the user to log properly
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id')
                .eq('stripe_subscription_id', subscriptionId)
                .single();

            const userId = profiles?.id;

            await supabase
                .from('profiles')
                .update({ plan: 'free' })
                .eq('stripe_subscription_id', subscriptionId);

            // Log Audit Action
            if (userId) {
                const { error: auditError } = await supabase.from('audit_logs').insert({
                    user_id: userId,
                    table_name: 'profiles',
                    record_id: userId,
                    action: 'SUBSCRIPTION_DOWNGRADE',
                    source: 'STRIPE_WEBHOOK',
                    new_data: {
                        plan: 'free',
                        subscription_id: subscriptionId,
                        reason: 'subscription_deleted'
                    },
                    created_at: new Date().toISOString()
                });
                if (auditError) console.error('AUDIT LOG FAILED:', auditError);
            }
            break;
        }

        case 'invoice.payment_succeeded': {
            // Extract user info if available in metadata or look up via customer
            // For now, simple logging
            // Log Revenue/Payment Success
            const subscriptionId = object.subscription;

            if (subscriptionId) {
                const { error: auditError } = await supabase.from('audit_logs').insert({
                    user_id: null, // Often harder to resolve synchronously without lookups
                    table_name: 'invoices',
                    record_id: object.id || '00000000-0000-0000-0000-000000000000',
                    action: 'PAYMENT_SUCCESS',
                    source: 'STRIPE_WEBHOOK',
                    new_data: {
                        subscription: subscriptionId,
                        customer: object.customer
                    },
                    created_at: new Date().toISOString()
                });
                if (auditError) console.error('AUDIT LOG FAILED:', auditError);
            }
            break;
        }
    }

    return { received: true };
};
