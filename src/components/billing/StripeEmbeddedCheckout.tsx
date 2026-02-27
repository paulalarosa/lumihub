import { useCallback, useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Make sure to add this key to your .env file
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

interface StripeEmbeddedCheckoutProps {
    priceId: string;
}

export const StripeEmbeddedCheckout = ({ priceId }: StripeEmbeddedCheckoutProps) => {
    const { user } = useAuth();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchClientSecret = useCallback(async () => {
        try {
            if (!user) {
                throw new Error("Usuário não autenticado");
            }

            console.log("Fetching client secret for price:", priceId);

            const { data, error } = await supabase.functions.invoke("create-checkout", {
                body: {
                    priceId,
                    userId: user.id,
                    userEmail: user.email,
                },
            });

            if (error) {
                console.error("Supabase function error:", error);
                throw error;
            }

            if (!data?.clientSecret) {
                throw new Error("No client secret returned");
            }

            setClientSecret(data.clientSecret);
        } catch (err: any) {
            console.error("Error fetching client secret:", err);
            setError(err.message || "Erro ao iniciar o checkout.");
        }
    }, [priceId, user]);

    useEffect(() => {
        fetchClientSecret();
    }, [fetchClientSecret]);

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!clientSecret) {
        return (
            <div className="space-y-4 w-full">
                <Skeleton className="h-[400px] w-full rounded-xl bg-neutral-800" />
            </div>
        );
    }

    return (
        <div id="checkout" className="w-full bg-transparent rounded-xl overflow-hidden">
            <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret }}
            >
                <EmbeddedCheckout className="w-full" />
            </EmbeddedCheckoutProvider>
        </div>
    );
};
