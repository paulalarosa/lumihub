
import { supabase } from "@/integrations/supabase/client";

export class CommissionLogic {
    // Basic commission rule: 15% for Assistants if not specified
    private static DEFAULT_COMMISSION_RATE = 0.15;

    static calculateCommission(totalValue: number, customRate?: number): number {
        const rate = customRate || CommissionLogic.DEFAULT_COMMISSION_RATE;
        return totalValue * rate;
    }

    static async getFinancialReport(organizationId: string, startDate?: Date, endDate?: Date) {
        // Query events that are PAID
        let query = supabase
            .from('events')
            .select(`
                total_value,
                assistant_commission,
                payment_status,
                event_date
            `)
            .eq('user_id', organizationId) // Assuming orgId matches user_id ownership
            .eq('payment_status', 'paid');

        if (startDate) {
            query = query.gte('event_date', startDate.toISOString());
        }
        if (endDate) {
            query = query.lte('event_date', endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching financial report:', error);
            throw error;
        }

        const stats = data.reduce((acc, curr) => {
            acc.totalRevenue += Number(curr.total_value) || 0;
            acc.totalCommissions += Number(curr.assistant_commission) || 0;
            return acc;
        }, { totalRevenue: 0, totalCommissions: 0 });

        return stats;
    }
    static async getAssistantCommissions(assistantId: string, startDate?: Date, endDate?: Date) {
        let query = supabase
            .from('event_assistants')
            .select(`
                event_id,
                events!inner (
                    total_value,
                    assistant_commission,
                    payment_status,
                    event_date
                )
            `)
            .eq('assistant_id', assistantId)
            .eq('events.payment_status', 'paid');

        if (startDate) {
            query = query.gte('events.event_date', startDate.toISOString());
        }
        if (endDate) {
            query = query.lte('events.event_date', endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching assistant commissions:', error);
            throw error;
        }

        // Calculate total
        // Note: events is an object inside each row because of the join
        const total = (data as any[] || []).reduce((acc, curr: any) => {
            // Assuming assistant_commission is total for the event. 
            // If multiple assistants, this logic gives full commission to everyone? 
            // For now, assume simplified model: commission on event is what this assistant gets.
            // Or if we want to be safer, we could divide, but let's stick to what's in DB.
            return acc + (Number(curr.events?.assistant_commission) || 0);
        }, 0);

        return { totalCommissions: total };
    }
}
