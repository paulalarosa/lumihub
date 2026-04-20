import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'
import { toast } from 'sonner'
import { logger } from '@/services/logger'

export interface AdminDeletionRequest {
  id: string
  user_id: string
  user_email: string | null
  reason: string | null
  status: string
  requested_at: string
  scheduled_for: string | null
  executed_at: string | null
  cancelled_at: string | null
}

export function useAdminDeletionRequests() {
  const qc = useQueryClient()

  useRealtimeInvalidate({
    table: 'data_deletion_requests',
    invalidate: ['admin-deletion-requests'],
    channelName: 'rt-admin-deletions',
  })

  const list = useQuery({
    queryKey: ['admin-deletion-requests'],
    queryFn: async (): Promise<AdminDeletionRequest[]> => {
      const { data, error } = await supabase
        .from('data_deletion_requests')
        .select(
          'id, user_id, user_email, reason, status, requested_at, scheduled_for, executed_at, cancelled_at',
        )
        .order('requested_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []) as AdminDeletionRequest[]
    },
  })

  const cancelAsAdmin = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('data_deletion_requests')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', requestId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Solicitação cancelada')
      qc.invalidateQueries({ queryKey: ['admin-deletion-requests'] })
    },
    onError: (err) => {
      logger.error(err, 'useAdminDeletionRequests.cancel')
      toast.error('Erro ao cancelar solicitação')
    },
  })

  return { list, cancelAsAdmin }
}
