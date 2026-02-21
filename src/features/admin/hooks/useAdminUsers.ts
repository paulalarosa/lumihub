import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Tables } from '@/integrations/supabase/types'
import { logger } from '@/services/logger'
import { useEffect } from 'react'

export const useAdminUsers = () => {
  const queryClient = useQueryClient()

  // Busca de usuários com Cache
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('useAdminUsers.fetch', error)
        throw error
      }
      return data as Tables<'profiles'>[]
    },
  })

  // Real-time Subscription para atualizar a tabela "ao vivo"
  useEffect(() => {
    const channel = supabase
      .channel('admin-users-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload: any) => {
          logger.info('Real-time event on profiles:', payload)
          queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  // Mutação para deletar (Exemplo)
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
