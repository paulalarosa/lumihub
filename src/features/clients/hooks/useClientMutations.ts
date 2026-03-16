import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { ClientService } from '../api/clientService'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'

export function useClientMutations() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const createMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const newClient = await ClientService.create(clientData)

      // Portal link logic
      if (clientData.is_bride && newClient && 'id' in newClient) {
        const link = `https://khaoskontrol.com.br/portal/${newClient.id}`
        await ClientService.update(newClient.id, { portal_link: link })
      }

      // Welcome email logic
      if (clientData.is_bride && clientData.email && newClient?.id) {
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              clientId: newClient.id,
              subject: 'Bem-vinda ao KONTROL',
            },
          })
        } catch (emailErr) {
          logger.error(emailErr, 'useClientMutations.create.email')
        }
      }

      return newClient
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      toast({ title: 'Cliente adicionado!' })
    },
    onError: (error) => {
      logger.error(error, 'useClientMutations.create')
      toast({
        title: 'Erro ao adicionar cliente',
        description:
          error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (data.is_bride) {
        data.portal_link = `https://khaoskontrol.com.br/portal/${id}`
      }

      const result = await ClientService.update(id, data)

      // Sync wedding date with projects
      if (data.is_bride && data.wedding_date) {
        await supabase
          .from('projects')
          .update({ event_date: data.wedding_date })
          .eq('client_id', id)
      }

      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENTS] })
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      toast({ title: 'Cliente atualizado!' })
    },
    onError: (error) => {
      logger.error(error, 'useClientMutations.update')
      toast({
        title: 'Erro ao atualizar cliente',
        description:
          error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
        variant: 'destructive',
      })
    },
  })

  return {
    createMutation,
    updateMutation,
  }
}
