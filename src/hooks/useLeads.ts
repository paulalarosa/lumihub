import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LeadData {
    name: string;
    email: string;
    phone?: string;
    weddingDate?: Date;
    isBride?: boolean;
}

interface UseLeadsReturn {
    submitLead: (data: LeadData) => Promise<{ success: boolean; error?: string }>;
    isLoading: boolean;
}

export function useLeads(): UseLeadsReturn {
    const [isLoading, setIsLoading] = useState(false);

    const submitLead = async (data: LeadData): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            // 1. Persist to Database (Assuming 'wedding_clients' or 'leads' table)
            // Using 'wedding_clients' based on previous context
            const { data: client, error: dbError } = await supabase
                .from('wedding_clients')
                .insert({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    wedding_date: data.weddingDate?.toISOString(),
                    is_bride: data.isBride,
                    // Default fields
                    status: 'lead',
                    user_id: (await supabase.auth.getUser()).data.user?.id
                })
                .select()
                .single();

            if (dbError) throw new Error(dbError.message);

            // 2. Send Welcome Email (Resend) via Edge Function
            if (data.isBride && client) {
                const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
                    body: {
                        clientId: client.id,
                        subject: "KONTROL // Welcome",
                    }
                });

                if (emailError) throw new Error("Email dispatch failed");
            }

            return { success: true };

        } catch (error: any) {
            return { success: false, error: error.message || "Unknown error" };
        } finally {
            setIsLoading(false);
        }
    };

    return { submitLead, isLoading };
}
