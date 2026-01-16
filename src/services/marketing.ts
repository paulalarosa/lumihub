// Marketing service - stubbed (table doesn't exist)

export interface MarketingCampaign {
    id: string;
    user_id: string;
    title: string;
    content: string;
    category: string;
    created_at: string;
    updated_at: string;
}

export const MarketingService = {
    async getAll(): Promise<MarketingCampaign[]> {
        return [];
    },

    async create(campaign: Omit<MarketingCampaign, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<MarketingCampaign> {
        throw new Error('Marketing campaigns table not available');
    },

    async update(id: string, updates: Partial<Omit<MarketingCampaign, 'id' | 'user_id' | 'created_at'>>): Promise<MarketingCampaign> {
        throw new Error('Marketing campaigns table not available');
    },

    async delete(id: string): Promise<void> {
        throw new Error('Marketing campaigns table not available');
    }
};
