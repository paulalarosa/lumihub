import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { useDashboardStats } from '@/hooks/useDashboardStats'

export function useDashboard() {
  const { user } = useAuth()
  const { organizationId, isOwner, loading: orgLoading } = useOrganization()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()

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
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', organizationId)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(5)
      return data || []
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
