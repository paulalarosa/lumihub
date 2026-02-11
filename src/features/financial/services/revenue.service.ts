import { supabase } from '@/integrations/supabase/client';

export const RevenueService = {
    async getTotalRevenue(organizationId: string) {
        const { data: invoices } = await supabase
            .from('invoices')
            .select('amount')
            .eq('user_id', organizationId);

        const payments = invoices || [];
        return payments.reduce((sum: number, p) => sum + (p.amount || 0), 0);
    }
};
