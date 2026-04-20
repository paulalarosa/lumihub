import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'

export function useDashboard() {
  const { user } = useAuth()
  const { organizationId, isOwner, loading: orgLoading } = useOrganization()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()

  useRealtimeInvalidate({
    table: [
      'profiles',
      'wedding_clients',
      'projects',
      'events',
      'invoices',
    ],
    invalidate: [
      ['dashboard-profile'],
      ['dashboard-clients-count'],
      ['dashboard-projects-count'],
      ['dashboard-upcoming-events'],
      ['dashboard-financials'],
      ['dashboard-stats'],
    ],
    filter: organizationId ? `user_id=eq.${organizationId}` : undefined,
    enabled: !!organizationId,
    channelName: 'rt-dashboard',
  })

  const { data: profileName = '', isLoading: profileLoading } = useQuery({
    queryKey: ['dashboard-profile', organizationId],
    queryFn: async () => {
      if (!organizationId) return ''
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', organizationId)
        .maybeSingle()
      return data?.full_name || ''
    },
    enabled: !!organizationId,
  })

  const { data: clientsCount = 0, isLoading: clientsLoading } = useQuery({
    queryKey: ['dashboard-clients-count', organizationId],
    queryFn: async () => {
      if (!organizationId) return 0
      const { count } = await supabase
        .from('wedding_clients')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', organizationId)
      return count || 0
    },
    enabled: !!organizationId,
  })

  const { data: projectsCount = 0, isLoading: projectsLoading } = useQuery({
    queryKey: ['dashboard-projects-count', organizationId],
    queryFn: async () => {
      if (!organizationId) return 0
      const { count } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', organizationId)
      return count || 0
    },
    enabled: !!organizationId,
  })

  const { data: upcomingEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['dashboard-upcoming-events', organizationId],
    queryFn: async () => {
      if (!organizationId) return []

      const today = format(new Date(), 'yyyy-MM-dd')

      const [eventsResponse, projectsResponse] = await Promise.all([
        supabase
          .from('events')
          .select('title, event_date, start_time')
          .eq('user_id', organizationId)
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(5),
        supabase
          .from('projects')
          .select('name, event_date')
          .eq('user_id', organizationId)
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(5)
      ])

      const events = (eventsResponse.data || []).map(e => ({
        title: e.title,
        event_date: e.event_date,
        start_time: e.start_time
      }))

      const projectEvents = (projectsResponse.data || []).map(p => ({
        title: p.name,
        event_date: p.event_date,
        start_time: null
      }))

      return [...events, ...projectEvents]
        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
        .slice(0, 5)
    },
    enabled: !!organizationId,
  })

  const marketingTriggers: { clientName: string; details: string }[] = []
  const triggersLoading = false

  const {
    data: financials = { totalRevenue: 0 },
    isLoading: financialsLoading,
  } = useQuery({
    queryKey: ['dashboard-financials', organizationId],
    queryFn: async () => {
      if (!organizationId || !isOwner) return { totalRevenue: 0 }
      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount, status')
        .eq('user_id', organizationId)
        .eq('status', 'paid')

      if (!invoices) return { totalRevenue: 0 }

      const total = invoices.reduce(
        (acc, curr) => acc + (Number(curr.amount) || 0),
        0,
      )

      return { totalRevenue: total }
    },
    enabled: !!organizationId && isOwner,
  })

  const originStats = useMemo(() => {
    if (!stats?.leadsConversion) return []
    return [
      { name: 'Convertidos', value: stats.leadsConversion.converted },
      { name: 'Pendentes', value: stats.leadsConversion.pending },
    ]
  }, [stats])

  const dataLoading =
    statsLoading ||
    profileLoading ||
    clientsLoading ||
    projectsLoading ||
    eventsLoading ||
    triggersLoading ||
    financialsLoading

  return {
    user,
    organizationId,
    isOwner,
    orgLoading,
    dataLoading,
    clientsCount,
    projectsCount,
    totalRevenue: financials.totalRevenue,
    upcomingEvents,
    marketingTriggers,
    profileName,
    originStats,
    stats,
  }
}
