import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'
import { subDays, subMonths, startOfMonth, endOfMonth, format } from 'date-fns'

interface ClientStats {
  total: number
  active: number
  inactive: number
  newLast30Days: number
  growthRate: number
}

interface MonthlyGrowth {
  month: string
  count: number
}

interface CompanyBreakdown {
  company: string
  count: number
}

export function useClientStats() {
  const { organizationId } = useOrganization()

  return useQuery({
    queryKey: ['client-stats', organizationId],
    queryFn: async (): Promise<ClientStats> => {
      if (!organizationId) {
        return {
          total: 0,
          active: 0,
          inactive: 0,
          newLast30Days: 0,
          growthRate: 0,
        }
      }

      const { data: clients, error } = await supabase
        .from('wedding_clients')
        .select('id, status, created_at')
        .eq('user_id', organizationId)

      if (error) throw error

      const total = clients?.length || 0
      const active = clients?.filter((c) => c.status === 'active').length || 0
      const inactive =
        clients?.filter((c) => c.status === 'inactive').length || 0

      const thirtyDaysAgo = subDays(new Date(), 30)
      const newLast30Days =
        clients?.filter((c) => new Date(c.created_at) >= thirtyDaysAgo)
          .length || 0

      const sixtyDaysAgo = subDays(new Date(), 60)
      const previousPeriod =
        clients?.filter(
          (c) =>
            new Date(c.created_at) >= sixtyDaysAgo &&
            new Date(c.created_at) < thirtyDaysAgo,
        ).length || 0

      const growthRate =
        previousPeriod > 0
          ? Math.round(
              ((newLast30Days - previousPeriod) / previousPeriod) * 100,
            )
          : newLast30Days > 0
            ? 100
            : 0

      return { total, active, inactive, newLast30Days, growthRate }
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  })
}

export function useClientGrowth() {
  const { organizationId } = useOrganization()

  return useQuery({
    queryKey: ['client-growth', organizationId],
    queryFn: async (): Promise<MonthlyGrowth[]> => {
      if (!organizationId) return []

      const months: MonthlyGrowth[] = []
      const now = new Date()

      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i)
        const _start = startOfMonth(monthDate)
        const end = endOfMonth(monthDate)

        const { count, error } = await supabase
          .from('wedding_clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', organizationId)
          .lte('created_at', end.toISOString())

        if (error) throw error

        months.push({
          month: format(monthDate, 'MMM'),
          count: count || 0,
        })
      }

      return months
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  })
}

export function useClientsByCompany() {
  const { organizationId } = useOrganization()

  return useQuery({
    queryKey: ['clients-by-company', organizationId],
    queryFn: async (): Promise<CompanyBreakdown[]> => {
      if (!organizationId) return []

      const { data, error } = await supabase
        .from('wedding_clients')
        .select('*')
        .eq('user_id', organizationId)

      if (error) throw error

      const companyCounts: Record<string, number> = {}
      data?.forEach((client: Record<string, unknown>) => {
        const company =
          (client.company as string) ||
          (client.notes as string)?.substring(0, 20) ||
          'Outros'
        companyCounts[company] = (companyCounts[company] || 0) + 1
      })

      return Object.entries(companyCounts)
        .map(([company, count]) => ({ company, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  })
}

export type { ClientStats, MonthlyGrowth, CompanyBreakdown }
