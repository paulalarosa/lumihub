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
    async getAll(): Promise<ServiceItem[]> {
        const { data, error } = await supabase
            .from("services")
            .select("id, name, price, duration_minutes, description, is_active")
            .order("name");

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
