import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/services/logger'
import { exportFinancialExcel } from '@/utils/exportExcel'

interface AnalyticsData {
  total_events: number
  total_clients: number
  new_clients_month: number
  monthly_revenue: number
  previous_month_revenue: number
  conversion_rate: number
  growth_revenue_percentage: number
  growth_client_percentage: number
  events_by_category: Array<{ name: string; value: number }>
  revenue_chart: Array<{ name: string; value: number }>
  client_sources: Array<{ name: string; value: number }>
  page_views: Array<{ name: string; value: number }>
}

export function useAdminAnalytics() {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async (): Promise<AnalyticsData> => {
      const { data, error } = await (supabase.rpc as CallableFunction)('get_admin_analytics')
      if (error) {
        logger.error('useAdminAnalytics.fetch', error)
        throw error
      }

      return data as AnalyticsData
    },
    staleTime: 1000 * 60 * 5,
  })

  const stats = {
    totalEvents: data?.total_events || 0,
    totalRevenue: data?.monthly_revenue || 0,
    newLeads: data?.new_clients_month || 0,
    conversionRate: data?.conversion_rate || 0,
    growth_client_percentage: data?.growth_client_percentage || 0,
    growth_revenue_percentage: data?.growth_revenue_percentage || 0,
    monthly_revenue: data?.monthly_revenue || 0,
    previous_month_revenue: data?.previous_month_revenue || 0,
    new_clients_month: data?.new_clients_month || 0,
    total_clients: data?.total_clients || 0,
  }

  const charts = {
    revenue: data?.revenue_chart || [],
    clients: data?.client_sources || [],
  }

  const categoryData = data?.events_by_category || []

  const pageData = (data?.page_views || []).map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
    value: p.value,
  }))

  const handleExportExcel = () => {
    if (!charts.revenue || charts.revenue.length === 0) return

    const dataToExport = charts.revenue.map((item) => ({
      Mês: item.name,
      Receita: item.value,
    }))

    exportFinancialExcel(dataToExport, 'Relatorio_Financeiro_KhaosKontrol')
  }

  const isPositive = (value: number) => value > 0

  return {
    events: [],
    charts,
    loading,
    stats,
    categoryData,
    pageData,
    handleExportExcel,
    isPositive,
  }
}
