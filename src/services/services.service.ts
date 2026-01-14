import { supabase } from "@/integrations/supabase/client";

export interface ServiceItem {
    id: string;
    title: string;
    price: number;
    duration_minutes: number;
    description: string | null;
}

export const ServicesService = {
    async getAll(): Promise<ServiceItem[]> {
        const { data, error } = await supabase
            .from("services")
            .select("*")
            .order("title");

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
