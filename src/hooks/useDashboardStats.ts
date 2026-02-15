import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { addDays, isAfter, isBefore, startOfDay } from 'date-fns';

export interface DashboardStats {
    totalBudgets: number;       // "Total de orçamentos geridos" (Sum of project values)
    avgWeddingValue: number;    // "Média de valor por casamento"
    weddingsNext90Days: number; // "Contagem de casamentos nos próximos 90 dias"
    leadsConversion: {
        converted: number;
        pending: number;
        total: number;
    };
    loading: boolean;
}

export function useDashboardStats() {
    const { session } = useAuthStore();
    const [stats, setStats] = useState<DashboardStats>({
        totalBudgets: 0,
        avgWeddingValue: 0,
        weddingsNext90Days: 0,
        leadsConversion: { converted: 0, pending: 0, total: 0 },
        loading: true
    });

    useEffect(() => {
        if (!session?.user?.id) return;

        const fetchStats = async () => {
            try {
                // 1. Fetch Clients (Leads vs Converted)
                // Assumption: Converted = has 'is_bride' true or linked to a project. 
                // Let's use 'is_bride' as a proxy for "Closed/Converted" based on common logic, 
                // OR check if they have a project. 
                // Project count is a better "Business" metric. 
                const { data: clients, error: clientsError } = await supabase
                    .from('wedding_clients')
                    .select('id, is_bride, projects(id)');

                if (clientsError) throw clientsError;

                const totalClients = clients?.length || 0;
                // A client is converted if they have at least one project
                const converted = clients?.filter(c => c.projects && c.projects.length > 0).length || 0;
                const pending = totalClients - converted;

                // 2. Fetch Projects + Services (Financials)
                // We need sum of all services for all projects to get "Total Managed Budget"
                const { data: projectServices, error: financeError } = await supabase
                    .from('project_services')
                    .select('*, service:services(price)');

                if (financeError) throw financeError;

                // Calculate Total Budget Managed
                let totalBudget = 0;
                projectServices?.forEach((ps) => {
                    const price = parseFloat(ps.service?.price || '0') || 0;
                    totalBudget += price;
                });

                const avgValue = converted > 0 ? (totalBudget / converted) : 0;

                // 3. Events (Next 90 Days)
                const now = startOfDay(new Date());
                const ninetyDaysFromNow = addDays(now, 90);

                const { data: events, error: eventsError } = await supabase
                    .from('events')
                    .select('event_date')
                    .gte('event_date', now.toISOString())
                    .lte('event_date', ninetyDaysFromNow.toISOString());

                if (eventsError) throw eventsError;

                const upcomingCount = events?.length || 0;

                setStats({
                    totalBudgets: totalBudget,
                    avgWeddingValue: avgValue,
                    weddingsNext90Days: upcomingCount,
                    leadsConversion: { converted, pending, total: totalClients },
                    loading: false
                });

            } catch (error) {
                console.error("Dashboard Stats Error:", error);
                setStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchStats();
    }, [session?.user?.id]);

    return stats;
}
