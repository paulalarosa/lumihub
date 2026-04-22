import { supabase } from "@/integrations/supabase/client";

export interface ServiceItem {
    id: string;
    name: string;
    price: number | null;
    duration_minutes: number | null;
    description: string | null;
    is_active: boolean;
}

export const ServicesService = {
    // Explicit user_id filter: RLS em services ancora em auth.uid(), mas
    // assistentes operam via organizationId (parent_user_id). Filtrar pela
    // org resolver garante que a lista bate com os serviços da maquiadora,
    // não da assistente logada.
    async getAll(organizationId?: string): Promise<ServiceItem[]> {
        const query = supabase
            .from("services")
            .select("id, name, price, duration_minutes, description, is_active")
            .order("name");

        if (organizationId) {
            query.eq("user_id", organizationId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from("services")
            .delete()
            .eq("id", id);

        if (error) throw error;
    }
};
