import { supabase } from "@/integrations/supabase/client";

export interface MarketingCampaign {
    id: string;
    user_id: string;
    title: string;
    content: string;
    category: string; // 'casual' | 'promo' | 'news' | 'general'
    created_at: string;
    updated_at: string;
}

export const MarketingService = {
    async getAll(): Promise<MarketingCampaign[]> {
        const { data, error } = await supabase
            .from('marketing_campaigns')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async create(campaign: Omit<MarketingCampaign, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<MarketingCampaign> {
        const { data, error } = await supabase
            .from('marketing_campaigns')
            .insert(campaign)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Omit<MarketingCampaign, 'id' | 'user_id' | 'created_at'>>): Promise<MarketingCampaign> {
        const { data, error } = await supabase
            .from('marketing_campaigns')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('marketing_campaigns')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
