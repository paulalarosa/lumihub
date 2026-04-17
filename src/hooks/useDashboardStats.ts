import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { addDays } from 'date-fns/addDays'
import { startOfDay } from 'date-fns/startOfDay'

export interface DashboardStats {
  totalBudgets: number
  avgWeddingValue: number
  weddingsNext90Days: number
  leadsConversion: {
    converted: number
    pending: number
    total: number
  }
}

export function useDashboardStats() {
  const { session } = useAuth()
  const userId = session?.user?.id
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('dashboard-stats-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wedding_clients',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_services',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])

  return useQuery({
    queryKey: ['dashboard-stats', userId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const { data: clients, error: clientsError } = await supabase
        .from('wedding_clients')
        .select('id, is_bride, projects(id)')
        .eq('user_id', userId)

      if (clientsError) throw clientsError

      const totalClients = clients?.length || 0
      const converted =
        clients?.filter((c) => c.projects && c.projects.length > 0).length || 0
      const pending = totalClients - converted

      const { data: projectServices, error: financeError } = await supabase
        .from('project_services')
        .select('*, project:projects!inner(user_id), service:services(price)')
        .eq('project.user_id', userId)

      if (financeError) throw financeError

      let totalBudget = 0
      projectServices?.forEach((ps) => {
        const price = parseFloat(ps.service?.price || '0') || 0
        totalBudget += price
      })

      const avgValue = converted > 0 ? totalBudget / converted : 0

      const now = startOfDay(new Date())
      const ninetyDaysFromNow = addDays(now, 90)

      const [eventsResponse, projectsResponse] = await Promise.all([
        supabase
          .from('events')
          .select('id')
          .eq('user_id', userId)
          .gte('event_date', now.toISOString())
          .lte('event_date', ninetyDaysFromNow.toISOString()),
        supabase
          .from('projects')
          .select('id')
          .eq('user_id', userId)
          .gte('event_date', now.toISOString())
          .lte('event_date', ninetyDaysFromNow.toISOString())
      ])

      const upcomingCount = (eventsResponse.data?.length || 0) + (projectsResponse.data?.length || 0)

      return {
        totalBudgets: totalBudget,
        avgWeddingValue: avgValue,
        weddingsNext90Days: upcomingCount,
        leadsConversion: { converted, pending, total: totalClients },
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })
}
