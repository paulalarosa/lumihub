import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'
import { QUERY_KEYS } from '@/constants/queryKeys'

export const useDeleteClient = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wedding_clients')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_METRICS] })

      toast({
        title: 'CLIENTE REMOVIDO',
        description: 'O registro foi apagado do sistema com sucesso.',
      })
    },
    onError: (error) => {
      logger.error(error, 'useDeleteClient.onError', { showToast: false })
      toast({
        variant: 'destructive',
        title: 'ERRO DE REMOÇÃO',
        description: 'Não foi possível completar a operação. Tente novamente.',
      })
    },
  })
}
