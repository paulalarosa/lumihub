import { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { exportFinancialExcel } from '@/utils/exportExcel';

interface DashboardStats {
    events: Array<{
        type?: string;
        category?: string;
        action?: string;
        page_path?: string;
        timestamp: string;
        [key: string]: unknown;
    }>;
    stats: {
        totalEvents: number;
        totalRevenue: number;
        newLeads: number;
        conversionRate: number;
        growth_client_percentage: number;
        growth_revenue_percentage: number;
        monthly_revenue: number;
        previous_month_revenue: number;
        new_clients_month: number;
        total_clients: number;
    };
    charts: {
        revenue: { name: string; value: number }[];
        clients: { name: string; value: number }[];
    };
}

export type { DashboardStats };

const DEFAULT_STATS: DashboardStats['stats'] = {
    totalEvents: 0,
    totalRevenue: 0,
    newLeads: 0,
    conversionRate: 0,
    growth_client_percentage: 0,
    growth_revenue_percentage: 0,
    monthly_revenue: 0,
    previous_month_revenue: 0,
    new_clients_month: 0,
    total_clients: 0,
};

export function useAdminAnalytics() {
    const [events, setEvents] = useState<DashboardStats['events']>([]);
    const [charts, setCharts] = useState<DashboardStats['charts']>({ revenue: [], clients: [] });
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats['stats']>(DEFAULT_STATS);

    const { fetchDashboardStats } = useAnalytics();

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        const data = await fetchDashboardStats();
        if (data) {
            setEvents(data.events as unknown as DashboardStats['events']);
            setStats(data.stats as DashboardStats['stats']);
            setCharts(data.charts || { revenue: [], clients: [] });
        }
        setLoading(false);
    };

    const eventsByCategory = events.reduce((acc: Record<string, number>, e) => {
        const cat = e.category || e.type || 'other';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const categoryData = Object.entries(eventsByCategory).map(([name, value]) => ({ name, value }));

    const pageViewData = events
        .filter(e => e.type === 'page_view')
        .reduce((acc: Record<string, number>, e) => {
            const path = e.page_path || '/';
            acc[path] = (acc[path] || 0) + 1;
            return acc;
        }, {});

    const pageData = Object.entries(pageViewData)
        .map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, value }))
        .slice(0, 10);

    const handleExportExcel = () => {
        if (!charts?.revenue) return;
        const dataToExport = charts.revenue.map(item => ({
            Mês: item.name,
            Receita: item.value,
        }));
        exportFinancialExcel(dataToExport, 'Relatorio_Financeiro_Lumi');
    };

    const isPositive = (value: number) => value > 0;

    return {
        events,
        charts,
        loading,
        stats,
        categoryData,
        pageData,
        handleExportExcel,
        isPositive,
    };
}
