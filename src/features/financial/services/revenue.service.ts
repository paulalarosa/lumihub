import { supabase } from '@/integrations/supabase/client';

export const RevenueService = {
    async getTotalRevenue(organizationId: string) {
        // Only count paid invoices. Cancelled/archived are explicitly
        // excluded so the "receita total" KPI matches what the maquiadora
        // considers money in the door, not everything ever issued.
        const { data: invoices } = await supabase
            .from('invoices')
            .select('amount, status')
            .eq('user_id', organizationId)
            .eq('status', 'paid');

        return (invoices ?? []).reduce((sum, row) => {
            const raw = row.amount;
            const n =
                raw == null || raw === ''
                    ? 0
                    : Number.parseFloat(String(raw));
            return sum + (Number.isFinite(n) ? n : 0);
        }, 0);
    },
};
