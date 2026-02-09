// This file represents the logic that would run in a Supabase Edge Function
// for handling Stripe Webhooks.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    switch (type) {
        case 'checkout.session.completed': {
            const userId = object.metadata.user_id;
            const subscriptionId = object.subscription;

            // 1. Update Profile Plan
            await supabase
                .from('profiles')
                .update({
                    plan: 'pro', // Derived from price ID/metadata usually
                    stripe_customer_id: object.customer,
                    stripe_subscription_id: subscriptionId
                })
                .eq('id', userId);

            // 2. Log Transaction (Platform Revenue)
            // Note: We might want a separate table for Platform Revenue vs User Business Transactions
            break;
        }

        case 'customer.subscription.deleted': {
            const subscriptionId = object.id;

            // Downgrade user
            await supabase
                .from('profiles')
                .update({ plan: 'free' })
                .eq('stripe_subscription_id', subscriptionId);
            break;
        }

        case 'invoice.payment_succeeded': {
            // Extend subscription validity, log revenue
            break;
        }
    }

    return { received: true };
};
