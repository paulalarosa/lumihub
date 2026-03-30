import { useAdminStats } from './useAdminStats'
import { exportFinancialExcel } from '@/utils/exportExcel'

export function useAdminAnalytics() {
  const { data, isLoading: loading } = useAdminStats()

  const events = data?.events || []
  const stats = data?.stats || {
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
  }
  const charts = data?.charts || { revenue: [], clients: [] }

  const eventsByCategory = events.reduce(
    (acc: Record<string, number>, e: Record<string, unknown>) => {
      const cat = (e.category as string) || (e.type as string) || 'other'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    },
    {},
  )

  const categoryData = Object.entries(eventsByCategory).map(
    ([name, value]) => ({ name, value }),
  )

  const pageViewData = events
    .filter((e: Record<string, unknown>) => e.type === 'page_view')
    .reduce((acc: Record<string, number>, e: Record<string, unknown>) => {
      const path = (e.page_path as string) || '/'
      acc[path] = (acc[path] || 0) + 1
      return acc
    }, {})

  const pageData = Object.entries(pageViewData)
    .map(([name, value]) => ({
      name: name.length > 15 ? name.slice(0, 15) + '...' : name,
      value: value as number,
    }))
    .slice(0, 10)

  const handleExportExcel = () => {
    if (!charts?.revenue) return
    const dataToExport = charts.revenue.map(
      (item: Record<string, unknown>) => ({
        Mês: item.name as string,
        Receita: item.value as number,
      }),
    )
    exportFinancialExcel(dataToExport, 'Relatorio_Financeiro_Lumi')
  }

  const isPositive = (value: number) => value > 0

  return {
    events,
    charts,
    loading,
    stats,
    categoryData,
    pageData,
    handleExportExcel,
    isPositive,
  }
}
