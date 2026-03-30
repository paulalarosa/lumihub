import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useIsAdmin() {
  const { user } = useAuth()

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      return data?.role === 'admin'
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })

  return { isAdmin: !!isAdmin, isLoading }
}
