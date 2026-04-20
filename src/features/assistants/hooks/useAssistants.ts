import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { logger } from '@/services/logger'

export interface Assistant {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  is_registered: boolean
  invite_token: string
  created_at: string
}

export const useAssistants = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const fetchAssistants = async () => {
    if (!user) return []

    // Discover this user's makeup_artist id. Assistants are linked to the
    // maquiadora via `assistant_access.makeup_artist_id`, not directly via
    // `assistants.user_id` (that column stays null until the invitee accepts).
    // Previously this hook queried `assistants` directly and relied on RLS,
    // which silently returned empty when the profile had no makeup_artist row
    // or when the RLS subquery broke — making invited but not yet accepted
    // assistants disappear from the maquiadora's view.
    const { data: profile } = await supabase
      .from('profiles')
      .select('parent_user_id')
      .eq('id', user.id)
      .maybeSingle()

    const organizationId = profile?.parent_user_id || user.id

    const { data: professional } = await supabase
      .from('makeup_artists')
      .select('id')
      .eq('user_id', organizationId)
      .maybeSingle()

    if (!professional) return []

    const { data: access, error } = await supabase
      .from('assistant_access')
      .select('assistant:assistants(*)')
      .eq('makeup_artist_id', professional.id)
      .eq('status', 'active')

    if (error) {
      logger.error(error, 'useAssistants.fetch')
      throw error
    }

    const rows =
      (access ?? [])
        .map((row) => row.assistant)
        .filter((a): a is NonNullable<typeof a> => !!a)
        .sort((a, b) =>
          (a.full_name ?? '').localeCompare(b.full_name ?? ''),
        ) ?? []
    return rows
  }

  const query = useQuery({
    queryKey: [QUERY_KEYS.ASSISTANTS, user?.id],
    queryFn: fetchAssistants,
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: async (vars: {
      fullName: string
      email: string | null
      phone: string | null
    }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) throw new Error('User not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, parent_user_id')
        .eq('id', userData.user.id)
        .maybeSingle()

      const organizationId = profile?.parent_user_id || userData.user.id

      const { data: professional } = await supabase
        .from('makeup_artists')
        .select('id')
        .eq('user_id', organizationId)
        .single()

      if (!professional) throw new Error('Profissional não encontrado')

      const token = crypto.randomUUID()
      const { data: assistant, error } = await supabase
        .from('assistants')
        .insert({
          user_id: null,
          full_name: vars.fullName,
          email: vars.email,
          phone: vars.phone,
          invite_token: token,
        })
        .select()
        .single()

      if (error) throw error

      const { error: accessError } = await supabase
        .from('assistant_access')
        .insert({
          assistant_id: assistant.id,
          makeup_artist_id: professional.id,
          status: 'active',
        })

      if (accessError) throw accessError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ASSISTANTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_METRICS] })
      toast({ title: 'Sucesso', description: 'Assistente cadastrada' })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (vars: {
      id: string
      fullName: string
      email: string | null
      phone: string | null
    }) => {
      const { error } = await supabase
        .from('assistants')
        .update({
          full_name: vars.fullName,
          email: vars.email,
          phone: vars.phone,
        })
        .eq('id', vars.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ASSISTANTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_METRICS] })
      toast({ title: 'Sucesso', description: 'Assistente atualizada' })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assistants').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ASSISTANTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_METRICS] })
      toast({ title: 'Sucesso', description: 'Assistente excluída' })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  return {
    assistants: query.data || [],
    isLoading: query.isLoading,
    createAssistant: createMutation.mutateAsync,
    updateAssistant: updateMutation.mutateAsync,
    deleteAssistant: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
