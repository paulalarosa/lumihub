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

async function fetchAdminStats(): Promise<AdminStats> {
  const now = new Date()
  const todayIso = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthIso = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    totalRes,
    todayRes,
    weekRes,
    monthRes,
    subsRes,
    recentRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekIso),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthIso),
    supabase.from('subscriptions').select('price_monthly, status, plan_type').eq('status', 'active'),
    supabase
      .from('profiles')
      .select('id, full_name, email, subscription_tier, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  if (totalRes.error) throw totalRes.error

  const activeSubs = subsRes.data || []
  const mrr = activeSubs.reduce((sum, s) => sum + (s.price_monthly || 0), 0)

  const planCounts: Record<string, number> = {}
  activeSubs.forEach((s) => {
    const plan = s.plan_type || 'free'
    planCounts[plan] = (planCounts[plan] || 0) + 1
  })
  const plan_distribution = Object.entries(planCounts).map(([plan, count]) => ({ plan, count }))

  const recent_signups = (recentRes.data || []).map((p) => ({
    id: p.id,
    full_name: p.full_name || 'Sem nome',
    email: p.email || '',
    plan: p.subscription_tier || 'free',
    created_at: p.created_at || '',
  }))

  return {
    total_users: totalRes.count || 0,
    new_users_today: todayRes.count || 0,
    new_users_week: weekRes.count || 0,
    new_users_month: monthRes.count || 0,
    active_subscriptions: activeSubs.length,
    mrr,
    churn_rate: 0,
    plan_distribution,
    recent_signups,
    revenue_by_month: [],
  }
}

export function useAdminDashboard() {
  const queryClient = useQueryClient()

  const statsQuery = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async (): Promise<AdminStats> => {
      try {
        return await fetchAdminStats()
      } catch (error) {
        logger.error('useAdminDashboard.fetchStats', error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
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
        { event: '*', schema: 'public', table: 'subscriptions' },
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
