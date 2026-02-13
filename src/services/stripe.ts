import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
    console.error("Missing VITE_STRIPE_PUBLISHABLE_KEY. Stripe will not work.");
}

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface CheckoutOptions {
    priceId: string;
    projectId?: string; // Used as client_reference_id
    successUrl?: string; // Optional override
    cancelUrl?: string; // Optional override
}

export const StripeService = {
    async checkout({ priceId, projectId, successUrl, cancelUrl }: CheckoutOptions) {
        try {
            const stripe = await stripePromise;
            if (!stripe) {
                throw new Error("Stripe Failed to Initialize");
            }

            const { error } = await stripe.redirectToCheckout({
                lineItems: [{ price: priceId, quantity: 1 }],
                mode: 'subscription',
                successUrl: successUrl || 'https://khaoskontrol.com.br/dashboard?payment=success',
                cancelUrl: cancelUrl || 'https://khaoskontrol.com.br/dashboard?payment=cancelled',
                clientReferenceId: projectId, // This ties the checkout to our internal project/user
            });

            if (error) {
                throw error;
            }

        } catch (error) {
            console.error("Stripe Checkout Error:", error);
            toast.error("Erro ao iniciar pagamento. Tente novamente.");
            throw error;
        }
    }
};
