import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'
import { ClientService } from '../api/clientService'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'
import { analyticsService } from '@/services/analytics.service'
import { useAuth } from '@/hooks/useAuth'
import {
  ensureWithinUsageLimit,
  UsageLimitError,
  showUsageLimitToast,
} from '@/lib/usageLimit'

export function useClientMutations() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()

  const createMutation = useMutation({
    mutationFn: async (
      clientData: Database['public']['Tables']['wedding_clients']['Insert'],
    ) => {
      if (user) await ensureWithinUsageLimit(user.id, 'clients')

      const newClient = await ClientService.create(clientData)

      if (clientData.is_bride && newClient && 'id' in newClient) {
        // Persist the runtime origin so the link is correct in both prod
        // (khaoskontrol.com.br) and dev (localhost). Falls back to prod
        // host when origin is unavailable (SSR / server context).
        const origin =
          typeof window !== 'undefined' && window.location?.origin
            ? window.location.origin
            : 'https://khaoskontrol.com.br'
        const link = `${origin}/portal/${newClient.id}`
        await ClientService.update(newClient.id, { portal_link: link })
      }

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      analyticsService.trackEvent({
        action: 'client_created',
        category: 'feature_usage',
        label: variables.is_bride ? 'bride' : 'regular',
      })
      toast({ title: 'Cliente adicionado!' })
    },
    onError: (error) => {
      if (error instanceof UsageLimitError) {
        showUsageLimitToast(error, () =>
          navigate('/configuracoes/assinatura'),
        )
        return
      }
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
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Database['public']['Tables']['wedding_clients']['Update']
    }) => {
      if (data.is_bride) {
        const origin =
          typeof window !== 'undefined' && window.location?.origin
            ? window.location.origin
            : 'https://khaoskontrol.com.br'
        data.portal_link = `${origin}/portal/${id}`
      }

      const result = await ClientService.update(id, data)

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
