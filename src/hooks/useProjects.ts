import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

export interface Project {
  id: string
  name: string
  client?: {
    full_name: string
  }
  client_id: string
  status: string
  created_at: string
}

export function useProjects() {
  const { user } = useAuth()

  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('projects')
        .select('*, client:wedding_clients(full_name)')
        .order('name')

      if (error) throw error
      return data
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

  return { projects, loading }
}
