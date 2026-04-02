import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/services/logger'

interface AdminStats {
  total_users: number
  new_users_today: number
  new_users_week: number
  new_users_month: number
  active_subscriptions: number
  mrr: number
  churn_rate: number
  plan_distribution: Array<{ plan: string; count: number }>
  recent_signups: Array<{
    id: string
    full_name: string
    email: string
    plan: string
    created_at: string
  }>
  revenue_by_month: Array<{ month: string; revenue: number }>
}

export function useAdminDashboard() {
  const queryClient = useQueryClient()

  const statsQuery = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async (): Promise<AdminStats> => {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats')

      if (error) {
        logger.error('useAdminDashboard.fetchStats', error)
        throw error
      }

      return data as AdminStats
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  })

  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['admin-dashboard-stats'],
          })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['admin-dashboard-stats'],
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return statsQuery
}
