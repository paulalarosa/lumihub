import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export function useContractsQuery() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['contracts', user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data: contractsData, error } = await supabase
        .from('contracts')
        .select(
          `
          id, 
          title, 
          client_id, 
          status, 
          created_at, 
          signed_at, 
          content,
          signature_url,
          project_id
        `,
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const clientIds = contractsData
        .map((c) => c.client_id)
        .filter((id): id is string => !!id)

      const clientsMap: Record<string, string> = {}
      if (clientIds.length > 0) {
        const { data: clientsData } = await supabase
          .from('wedding_clients')
          .select('id, full_name')
          .in('id', clientIds)

        if (clientsData) {
          clientsData.forEach((c) => {
            clientsMap[c.id] = c.full_name
          })
        }
      }

      return contractsData.map((c) => ({
        ...c,
        clients: { name: clientsMap[c.client_id] || 'Cliente Desconhecido' },
      }))
    },
    enabled: !!user,
  })
}
