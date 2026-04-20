import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'

export interface AdminAssistantRow {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  is_upgraded: boolean | null
  created_at: string | null
  user_id: string | null
  owner_name: string | null
  owner_email: string | null
}

/**
 * Admin-facing list of assistants across all owners (maquiadoras).
 * Joins owner profile so admin can see who invited each assistant.
 */
export function useAdminAssistants() {
  useRealtimeInvalidate({
    table: ['assistants', 'profiles'],
    invalidate: ['admin-assistants'],
    channelName: 'rt-admin-assistants',
  })

  return useQuery({
    queryKey: ['admin-assistants'],
    queryFn: async (): Promise<AdminAssistantRow[]> => {
      const { data: assistants, error } = await supabase
        .from('assistants')
        .select('id, full_name, email, phone, is_upgraded, created_at, user_id')
        .order('created_at', { ascending: false })
      if (error) throw error
      if (!assistants || assistants.length === 0) return []

      const ownerIds = Array.from(
        new Set(assistants.map((a) => a.user_id).filter((x): x is string => !!x)),
      )

      const ownerMap = new Map<string, { full_name: string | null; email: string | null }>()
      if (ownerIds.length > 0) {
        const { data: owners } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', ownerIds)
        for (const o of owners ?? []) {
          ownerMap.set(o.id, { full_name: o.full_name, email: o.email })
        }
      }

      return assistants.map((a) => ({
        id: a.id,
        full_name: a.full_name,
        email: a.email,
        phone: a.phone,
        is_upgraded: a.is_upgraded,
        created_at: a.created_at,
        user_id: a.user_id,
        owner_name: a.user_id ? ownerMap.get(a.user_id)?.full_name ?? null : null,
        owner_email: a.user_id ? ownerMap.get(a.user_id)?.email ?? null : null,
      }))
    },
  })
}
