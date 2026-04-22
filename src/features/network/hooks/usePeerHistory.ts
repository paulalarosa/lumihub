import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export interface PeerHistoryStats {
  events_done: number
  events_upcoming: number
  last_done_at: string | null
}

/**
 * Histórico de colaboração entre o user logado e OUTRO peer específico.
 * Fonte: view `peer_collaboration_history` que agrega peer_event_assignments
 * por par (user_a, user_b = LEAST/GREATEST dos dois ids).
 *
 * Retorna { events_done, events_upcoming, last_done_at }. Se nunca
 * trabalharam juntas, todos os counts = 0.
 */
export function usePeerHistory(otherUserId: string | null | undefined) {
  const { user } = useAuth()
  const enabled = !!user && !!otherUserId && user.id !== otherUserId

  return useQuery({
    queryKey: ['peer-history', user?.id, otherUserId],
    queryFn: async (): Promise<PeerHistoryStats> => {
      if (!user || !otherUserId) {
        return { events_done: 0, events_upcoming: 0, last_done_at: null }
      }

      // user_a/user_b são normalizados por LEAST/GREATEST na view, então
      // o cliente precisa seguir o mesmo ordering na query.
      const [a, b] =
        user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id]

      const { data, error } = await supabase
        .from('peer_collaboration_history')
        .select('events_done, events_upcoming, last_done_at')
        .eq('user_a', a)
        .eq('user_b', b)
        .maybeSingle()

      if (error) throw error
      return (
        data ?? { events_done: 0, events_upcoming: 0, last_done_at: null }
      )
    },
    enabled,
    staleTime: 1000 * 60,
  })
}
