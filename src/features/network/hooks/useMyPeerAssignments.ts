import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'
import { AssignmentStatus } from './usePeerEventAssignments'

/**
 * Shape peer-safe retornada pela RPC `get_my_peer_assignments`. Nunca
 * inclui client_id, event.title, event.notes nem qualquer campo que
 * possa vazar dados da noiva.
 */
export interface MyPeerAssignment {
  id: string
  event_id: string
  status: AssignmentStatus
  agreed_fee: number
  notes: string | null
  created_at: string
  responded_at: string | null
  event_type: string | null
  event_date: string // ISO date
  start_time: string | null
  end_time: string | null
  location: string | null
  address: string | null
  host_user_id: string
  host_full_name: string | null
  host_email: string | null
}

/**
 * Hook PEER-side: a maquiadora B vê os eventos em que foi convidada
 * como reforço. Usa RPC com SECURITY DEFINER — B NUNCA faz select
 * direto em events, então não tem como vazar campos sensíveis.
 */
export function useMyPeerAssignments(status?: AssignmentStatus) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Realtime: assignment criado ou status mudado dispara refetch.
  useRealtimeInvalidate({
    table: ['peer_event_assignments'],
    invalidate: [['my-peer-assignments']],
    channelName: 'rt-my-peer-assignments',
    enabled: !!user,
  })

  const query = useQuery({
    queryKey: ['my-peer-assignments', user?.id, status ?? 'all'],
    queryFn: async (): Promise<MyPeerAssignment[]> => {
      if (!user) return []
      const { data, error } = await supabase.rpc('get_my_peer_assignments', {
        p_status: status ?? null,
      })
      if (error) throw error
      return (data ?? []) as unknown as MyPeerAssignment[]
    },
    enabled: !!user,
  })

  const respond = useMutation({
    mutationFn: async ({
      assignmentId,
      accept,
    }: {
      assignmentId: string
      accept: boolean
    }) => {
      const { error } = await supabase
        .from('peer_event_assignments')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', assignmentId)
      if (error) throw error
      return accept
    },
    onSuccess: (accepted) => {
      queryClient.invalidateQueries({ queryKey: ['my-peer-assignments'] })
      toast({
        title: accepted ? 'Reforço aceito' : 'Reforço recusado',
      })
    },
    onError: (err: Error) => {
      toast({
        title: 'Erro ao responder',
        description: err.message,
        variant: 'destructive',
      })
      logger.error(err, 'useMyPeerAssignments.respond')
    },
  })

  const pending = (query.data ?? []).filter((a) => a.status === 'invited')
  const upcoming = (query.data ?? []).filter((a) => a.status === 'accepted')
  const history = (query.data ?? []).filter((a) =>
    ['declined', 'cancelled', 'done'].includes(a.status),
  )

  return {
    all: query.data ?? [],
    pending,
    upcoming,
    history,
    isLoading: query.isLoading,
    respond,
  }
}
