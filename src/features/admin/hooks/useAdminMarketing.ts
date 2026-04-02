import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'

export interface Campaign {
  id: string
  name: string
  subject: string
  target_segment: string
  target_plans: string[]
  status: string
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number
  total_sent: number
  total_opened: number
  total_clicked: number
  created_at: string
}

export function useAdminMarketing() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const campaignsQuery = useQuery({
    queryKey: ['admin-marketing-campaigns'],
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await (supabase.rpc as any)(
        'get_marketing_campaigns',
        {
          p_limit: 50,
        },
      )

      if (error) {
        logger.error('useAdminMarketing.fetch', error)
        throw error
      }

      return (data as Campaign[]) || []
    },
  })

  const createCampaign = useMutation({
    mutationFn: async (params: {
      name: string
      subject: string
      body_html: string
      target_segment: string
      target_plans?: string[]
    }) => {
      const { data, error } = await (supabase.rpc as any)(
        'create_marketing_campaign',
        {
          p_name: params.name,
          p_subject: params.subject,
          p_body_html: params.body_html,
          p_target_segment: params.target_segment,
          p_target_plans: params.target_plans || [],
        },
      )

      if (error) throw error
      return data as {
        success: boolean
        campaign_id: string
        recipient_count: number
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Campanha criada',
        description: `${data.recipient_count} destinatários no segmento`,
      })
      queryClient.invalidateQueries({
        queryKey: ['admin-marketing-campaigns'],
      })
    },
    onError: (error) => {
      logger.error('useAdminMarketing.create', error)
      toast({
        title: 'Erro ao criar campanha',
        variant: 'destructive',
      })
    },
  })

  const sendCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke(
        'send-marketing-campaign',
        {
          body: { campaign_id: campaignId },
        },
      )

      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({
        title: 'Envio iniciado',
        description: 'Os emails estão sendo enviados em lote.',
      })
      queryClient.invalidateQueries({
        queryKey: ['admin-marketing-campaigns'],
      })
    },
    onError: (error) => {
      logger.error('useAdminMarketing.send', error)
      toast({
        title: 'Erro ao enviar campanha',
        variant: 'destructive',
      })
    },
  })

  const deleteCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await (supabase.rpc as any)(
        'delete_marketing_campaign',
        { p_campaign_id: campaignId },
      )
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({ title: 'Campanha excluída' })
      queryClient.invalidateQueries({
        queryKey: ['admin-marketing-campaigns'],
      })
    },
    onError: (error) => {
      logger.error('useAdminMarketing.delete', error)
      toast({
        title: 'Erro ao excluir',
        description: 'Só é possível excluir campanhas em rascunho.',
        variant: 'destructive',
      })
    },
  })

  return {
    campaigns: campaignsQuery.data || [],
    isLoading: campaignsQuery.isLoading,
    createCampaign,
    sendCampaign,
    deleteCampaign,
    refetch: campaignsQuery.refetch,
  }
}
