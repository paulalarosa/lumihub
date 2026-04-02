import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'

export interface DashboardMetrics {
  totalClients: number
  activeContracts: number
  leads: number
}

export const useDashboardMetrics = () => {
  const { organizationId } = useOrganization()

  return useQuery({
    queryKey: ['admin-metrics', organizationId],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!organizationId)
        return { totalClients: 0, activeContracts: 0, leads: 0 }

      const { count: totalCount } = await supabase
        .from('wedding_clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', organizationId)

      const { count: activeCount } = await supabase
        .from('wedding_clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', organizationId)
        .eq('status', 'active')

      const { count: leadCount } = await supabase
        .from('wedding_clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', organizationId)
        .eq('status', 'lead')

      return {
        totalClients: totalCount || 0,
        activeContracts: activeCount || 0,
        leads: leadCount || 0,
      }
    },
    enabled: !!organizationId,
    staleTime: 60 * 1000,
  })
}
