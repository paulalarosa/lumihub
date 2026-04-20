import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Tables } from '@/integrations/supabase/types'
import { logger } from '@/services/logger'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'

export const useAdminUsers = () => {
  const queryClient = useQueryClient()

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Return every profile EXCEPT those that are assistants. Originally the
      // list mixed both, causing assistants to show under "Profissionais".
      // A more aggressive previous fix filtered by makeup_artists membership,
      // which hid everyone still in trial/onboarding (no makeup_artists row
      // yet). The correct rule: show all profiles, minus assistants.
      const { data: assistants, error: assistantsErr } = await supabase
        .from('assistants')
        .select('user_id')

      if (assistantsErr) {
        logger.error(assistantsErr, 'useAdminUsers.fetchAssistants')
        throw assistantsErr
      }

      const assistantUserIds = new Set(
        (assistants ?? [])
          .map((a) => a.user_id)
          .filter((id): id is string => !!id),
      )

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        logger.error(error, 'useAdminUsers.fetch')
        throw error
      }

      return (data as Tables<'profiles'>[]).filter(
        (p) => !assistantUserIds.has(p.id),
      )
    },
  })

  useRealtimeInvalidate({
    table: ['profiles', 'makeup_artists', 'assistants'],
    invalidate: ['admin-users'],
    channelName: 'rt-admin-users',
  })

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      logger.info('Usuário removido com sucesso!')
    },
    onError: (err) =>
      logger.error('useAdminUsers.deleteUser', err, 'SYSTEM', {
        message: 'Erro ao deletar usuário',
      }),
  })

  return { ...usersQuery, deleteUser }
}
