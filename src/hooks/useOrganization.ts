import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { supabase } from '@/integrations/supabase/client'
import { User } from '@supabase/supabase-js'

export interface OrganizationInfo {
  organizationId: string | null
  isOwner: boolean
  loading: boolean
  user: User | null
}

export function useOrganization() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['organization', user?.id],
    queryFn: async () => {
      if (!user) return { organizationId: null, isOwner: false }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, parent_user_id')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        return { organizationId: user.id, isOwner: true }
      }

      if (profile?.parent_user_id) {
        return { organizationId: profile.parent_user_id, isOwner: false }
      }

      return { organizationId: user.id, isOwner: true }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60,
  })

  return {
    organizationId: data?.organizationId ?? null,
    isOwner: data?.isOwner ?? false,
    loading: isLoading,
    user,
  }
}
