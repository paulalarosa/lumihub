import { useQuery } from '@tanstack/react-query'
import { useAnalytics } from '@/hooks/useAnalytics'
import { QUERY_KEYS } from '@/constants/queryKeys'

export function useAdminStats() {
  const { fetchDashboardStats } = useAnalytics()

  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN_METRICS],
    queryFn: async () => {
      const data = await fetchDashboardStats()
      if (!data) throw new Error('Falha ao carregar estatísticas')
      return data
    },
    staleTime: 1000 * 60 * 5,
  })
}
