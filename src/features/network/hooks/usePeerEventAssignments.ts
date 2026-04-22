import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'

export type AssignmentStatus =
  | 'invited'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'done'

export interface PeerEventAssignment {
  id: string
  event_id: string
  host_user_id: string
  peer_user_id: string
  agreed_fee: number
  status: AssignmentStatus
  notes: string | null
  created_at: string
  responded_at: string | null
  peer_profile?: { full_name: string | null; email: string | null } | null
}

/**
 * Hook HOST-side: a maquiadora A gerencia os reforços chamados pra
 * um evento específico. Lista, convida, cancela.
 *
 * Peer-side tem outro hook (`useMyPeerAssignments`) que usa RPC peer-safe.
 */
export function usePeerEventAssignments(eventId: string | null | undefined) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Realtime: invalidar quando peer aceitar/recusar
  useRealtimeInvalidate({
    table: ['peer_event_assignments'],
    invalidate: [['peer-event-assignments', eventId ?? 'none']],
    channelName: `rt-pea-event-${eventId ?? 'none'}`,
    enabled: !!eventId && !!user,
  })

  const query = useQuery({
    queryKey: ['peer-event-assignments', eventId],
    queryFn: async (): Promise<PeerEventAssignment[]> => {
      if (!eventId) return []
      const { data, error } = await supabase
        .from('peer_event_assignments')
        .select(
          `
          *,
          peer_profile:profiles!peer_event_assignments_peer_user_id_fkey (
            full_name, email
          )
        `,
        )
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as PeerEventAssignment[]
    },
    enabled: !!eventId && !!user,
  })

  const invite = useMutation({
    mutationFn: async ({
      peerUserId,
      agreedFee,
      notes,
    }: {
      peerUserId: string
      agreedFee: number
      notes?: string
    }) => {
      if (!user) throw new Error('Não autenticado')
      if (!eventId) throw new Error('Sem evento selecionado')

      const fee = Number.isFinite(agreedFee) && agreedFee >= 0 ? agreedFee : 0

      const { error } = await supabase.from('peer_event_assignments').insert({
        event_id: eventId,
        host_user_id: user.id,
        peer_user_id: peerUserId,
        agreed_fee: fee,
        notes: notes?.trim() || null,
        status: 'invited',
      })

      // Trigger valida peer_connection accepted — se faltar, DB levanta
      // erro com HINT em PT que repassamos direto ao usuário.
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['peer-event-assignments', eventId],
      })
      toast({ title: 'Reforço convidado' })
    },
    onError: (err: Error) => {
      toast({
        title: 'Erro ao convidar',
        description: err.message,
        variant: 'destructive',
      })
      logger.error(err, 'usePeerEventAssignments.invite')
    },
  })

  const cancel = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('peer_event_assignments')
        .update({ status: 'cancelled' })
        .eq('id', assignmentId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['peer-event-assignments', eventId],
      })
      toast({ title: 'Convite cancelado' })
    },
    onError: (err: Error) => {
      toast({
        title: 'Erro ao cancelar',
        description: err.message,
        variant: 'destructive',
      })
      logger.error(err, 'usePeerEventAssignments.cancel')
    },
  })

  const markDone = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('peer_event_assignments')
        .update({ status: 'done' })
        .eq('id', assignmentId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['peer-event-assignments', eventId],
      })
    },
    onError: (err: Error) => {
      toast({
        title: 'Erro ao marcar concluído',
        description: err.message,
        variant: 'destructive',
      })
      logger.error(err, 'usePeerEventAssignments.markDone')
    },
  })

  return {
    assignments: query.data ?? [],
    isLoading: query.isLoading,
    invite,
    cancel,
    markDone,
  }
}
