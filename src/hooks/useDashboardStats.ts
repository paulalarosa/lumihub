import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useOrganization } from './useOrganization'
import { addDays } from 'date-fns/addDays'
import { startOfDay } from 'date-fns/startOfDay'
import { format } from 'date-fns/format'

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
  const { organizationId } = useOrganization()
  const userId = organizationId || session?.user?.id
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
      // project_services does not carry user_id, so we can't filter via RLS
      // channel. Rely on the `projects` subscription above — any insert/update
      // to a service line also touches projects.updated_at via trigger, which
      // invalidates this query. Avoids a cross-tenant noisy subscription.
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

      // Exclude archived/cancelled clients from KPIs so the dashboard reflects
      // the *active* pipeline, not historical garbage. Adjust allow-list as
      // new statuses are added.
      const { data: clients, error: clientsError } = await supabase
        .from('wedding_clients')
        .select('id, is_bride, status, projects(id, status)')
        .eq('user_id', userId)
        .not('status', 'in', '("archived","cancelled")')

      if (clientsError) throw clientsError

      const totalClients = clients?.length || 0
      // A client counts as "converted" when at least one non-cancelled project
      // exists. Deduped by client id (filter on clients, not projects).
      const converted =
        clients?.filter((c) =>
          (c.projects ?? []).some(
            (p) => !p?.status || p.status !== 'cancelled',
          ),
        ).length || 0
      const pending = totalClients - converted

      const { data: projectServices, error: financeError } = await supabase
        .from('project_services')
        .select(
          '*, project:projects!inner(user_id, status), service:services(price)',
        )
        .eq('project.user_id', userId)
        .not('project.status', 'in', '("cancelled")')

      if (financeError) throw financeError

      let totalBudget = 0
      projectServices?.forEach((ps) => {
        // service.price can be string (text column) or null. Guard both.
        const raw = ps.service?.price
        const price =
          raw == null || raw === '' ? 0 : Number.parseFloat(String(raw))
        if (Number.isFinite(price)) totalBudget += price
      })

      const avgValue = converted > 0 ? totalBudget / converted : 0

      // event_date columns are DATE, not TIMESTAMPTZ — compare as YYYY-MM-DD
      // strings to avoid timezone drift (a `.toISOString()` on "today" in São
      // Paulo becomes "yesterday 03:00 UTC").
      const now = startOfDay(new Date())
      const todayStr = format(now, 'yyyy-MM-dd')
      const ninetyDaysStr = format(addDays(now, 90), 'yyyy-MM-dd')

      const [eventsResponse, projectsResponse] = await Promise.all([
        supabase
          .from('events')
          .select('id')
          .eq('user_id', userId)
          .gte('event_date', todayStr)
          .lte('event_date', ninetyDaysStr),
        supabase
          .from('projects')
          .select('id')
          .eq('user_id', userId)
          .not('status', 'in', '("cancelled")')
          .gte('event_date', todayStr)
          .lte('event_date', ninetyDaysStr),
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
