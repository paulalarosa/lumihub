import { useQuery } from '@tanstack/react-query'
import { format, startOfMonth, startOfYear } from 'date-fns'
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
      'contracts',
    ],
    invalidate: [
      ['dashboard-profile'],
      ['dashboard-clients-count'],
      ['dashboard-projects-count'],
      ['dashboard-upcoming-events'],
      ['dashboard-financials'],
      ['dashboard-contracts-pending'],
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
      // Exclude archived/cancelled so the KPI reflects the active pipeline.
      const { count } = await supabase
        .from('wedding_clients')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', organizationId)
        .not('status', 'in', '("archived","cancelled")')
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
        .not('status', 'in', '("cancelled")')
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
          .not('status', 'in', '("cancelled")')
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(5),
      ])

      const events = (eventsResponse.data || []).map((e) => ({
        title: e.title,
        event_date: e.event_date,
        start_time: e.start_time,
      }))

      const projectEvents = (projectsResponse.data || []).map((p) => ({
        title: p.name,
        event_date: p.event_date,
        start_time: null,
      }))

      return [...events, ...projectEvents]
        .sort(
          (a, b) =>
            new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
        )
        .slice(0, 5)
    },
    enabled: !!organizationId,
  })

  const {
    data: financials = {
      totalRevenue: 0,
      revenueMTD: 0,
      revenueYTD: 0,
      pendingAmount: 0,
      overdueCount: 0,
    },
    isLoading: financialsLoading,
  } = useQuery({
    queryKey: ['dashboard-financials', organizationId],
    queryFn: async () => {
      if (!organizationId || !isOwner) {
        return {
          totalRevenue: 0,
          revenueMTD: 0,
          revenueYTD: 0,
          pendingAmount: 0,
          overdueCount: 0,
        }
      }

      // Pull paid + pending invoices together so we can derive revenue by
      // period (MTD / YTD / total) plus the outstanding pipeline in one round
      // trip. Filtering by paid_at when available gives a more honest period
      // cut; we fall back to created_at when paid_at is null.
      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount, status, paid_at, created_at, due_date')
        .eq('user_id', organizationId)

      if (!invoices)
        return {
          totalRevenue: 0,
          revenueMTD: 0,
          revenueYTD: 0,
          pendingAmount: 0,
          overdueCount: 0,
        }

      const now = new Date()
      const monthStart = startOfMonth(now).getTime()
      const yearStart = startOfYear(now).getTime()
      const todayStr = format(now, 'yyyy-MM-dd')

      let totalRevenue = 0
      let revenueMTD = 0
      let revenueYTD = 0
      let pendingAmount = 0
      let overdueCount = 0

      invoices.forEach((inv) => {
        const amount = Number(inv.amount) || 0
        if (inv.status === 'paid') {
          totalRevenue += amount
          const paidTs = inv.paid_at
            ? new Date(inv.paid_at).getTime()
            : inv.created_at
              ? new Date(inv.created_at).getTime()
              : 0
          if (paidTs >= monthStart) revenueMTD += amount
          if (paidTs >= yearStart) revenueYTD += amount
        } else if (inv.status === 'pending' || inv.status === 'open') {
          pendingAmount += amount
          if (inv.due_date && inv.due_date < todayStr) overdueCount += 1
        }
      })

      return {
        totalRevenue,
        revenueMTD,
        revenueYTD,
        pendingAmount,
        overdueCount,
      }
    },
    enabled: !!organizationId && isOwner,
  })

  const { data: contractsPending = 0, isLoading: contractsLoading } = useQuery({
    queryKey: ['dashboard-contracts-pending', organizationId],
    queryFn: async () => {
      if (!organizationId) return 0
      // "Pendente" = contrato criado/enviado mas ainda sem assinatura.
      // Contratos no status 'signed' (ou com signed_at preenchido) saem da
      // contagem.
      const { count } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', organizationId)
        .is('signed_at', null)
        .not('status', 'in', '("signed","cancelled","archived")')
      return count || 0
    },
    enabled: !!organizationId,
  })

  const dataLoading =
    statsLoading ||
    profileLoading ||
    clientsLoading ||
    projectsLoading ||
    eventsLoading ||
    financialsLoading ||
    contractsLoading

  return {
    user,
    organizationId,
    isOwner,
    orgLoading,
    dataLoading,
    clientsCount,
    projectsCount,
    contractsPending,
    totalRevenue: financials.totalRevenue,
    revenueMTD: financials.revenueMTD,
    revenueYTD: financials.revenueYTD,
    pendingAmount: financials.pendingAmount,
    overdueCount: financials.overdueCount,
    upcomingEvents,
    profileName,
    stats,
  }
}
