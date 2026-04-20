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
      // Only return profiles that are actual maquiadoras — those registered
      // in makeup_artists. Previously returned every row in profiles, which
      // included assistants (causing duplication in the admin panel between
      // the "Profissionais" and "Assistentes" tabs).
      const { data: artists, error: artistsErr } = await supabase
        .from('makeup_artists')
        .select('user_id')

      if (artistsErr) {
        logger.error('useAdminUsers.fetchArtists', artistsErr)
        throw artistsErr
      }

      const userIds = (artists ?? [])
        .map((a) => a.user_id)
        .filter((id): id is string => !!id)

      if (userIds.length === 0) return [] as Tables<'profiles'>[]

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('useAdminUsers.fetch', error)
        throw error
      }
      return data as Tables<'profiles'>[]
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
