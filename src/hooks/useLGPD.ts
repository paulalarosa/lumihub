import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'

interface Consent {
  consent_type: string
  granted: boolean
  granted_at: string | null
  revoked_at: string | null
  version: string
}

export function useLGPD() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const consentsQuery = useQuery({
    queryKey: ['user-consents'],
    queryFn: async (): Promise<Consent[]> => {
      const { data, error } = await supabase.rpc('get_my_consents')
      if (error) throw error
      return (data as Consent[]) || []
    },
    enabled: !!user,
  })

  const updateConsent = useMutation({
    mutationFn: async ({
      consentType,
      granted,
    }: {
      consentType: string
      granted: boolean
    }) => {
      const { error } = await supabase.rpc('record_user_consent', {
        p_consent_type: consentType,
        p_granted: granted,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-consents'] })
    },
  })

  const exportData = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('export_my_personal_data')
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meus-dados-khaoskontrol-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Dados exportados',
        description: 'Arquivo JSON baixado com sucesso.',
      })
    },
    onError: (error) => {
      logger.error('useLGPD.exportData', error)
      toast({
        title: 'Erro ao exportar',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    },
  })

  const requestDeletion = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('request_data_deletion')
      if (error) throw error
      return data as { success: boolean; message: string; request_id?: string }
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? 'Solicitação registrada' : 'Aviso',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      })
    },
    onError: (error) => {
      logger.error('useLGPD.requestDeletion', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a solicitação.',
        variant: 'destructive',
      })
    },
  })

  const isConsentGranted = (type: string): boolean => {
    const consent = consentsQuery.data?.find((c) => c.consent_type === type)
    return consent?.granted ?? false
  }

  return {
    consents: consentsQuery.data || [],
    isLoading: consentsQuery.isLoading,
    updateConsent,
    exportData,
    requestDeletion,
    isConsentGranted,
  }
}
