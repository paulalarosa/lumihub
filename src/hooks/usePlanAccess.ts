import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { logger } from '@/services/logger'

export const usePlanAccess = () => {
  const { user } = useAuth()
  const _queryClient = useQueryClient()

  const { data: planData, isLoading } = useQuery({
    queryKey: ['plan-access', user?.id],
    queryFn: async () => {
      if (!user) return null

      // plan_configs was dropped in the orphan cleanup migration. Canonical
      // table is now `plan_limits` keyed by plan_type. Supabase has no FK
      // between the two, so we fetch serially and merge here.
      const { data: artist, error: artistErr } = await supabase
        .from('makeup_artists')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (artistErr) throw artistErr

      let planLimits: {
        features?: Record<string, unknown> | null
        max_clients?: number | null
        max_team_members?: number | null
      } | null = null

      if (artist?.plan_type) {
        const { data: limits } = await supabase
          .from('plan_limits')
          .select('features, max_clients, max_team_members')
          .eq('plan_type', artist.plan_type)
          .maybeSingle()
        planLimits = limits ?? null
      }

      return {
        ...artist,
        features: (planLimits?.features as Record<string, unknown>) || {},
        limits: {
          maxClients: planLimits?.max_clients,
          maxTeamMembers: planLimits?.max_team_members,
        },
      }
    },
    enabled: !!user,
  })

  const checkFeatureAccess = async (feature: string) => {
    if (!user) return { allowed: false, reason: 'not_authenticated' }

    const { data, error } = await supabase.rpc('check_feature_access', {
      p_user_id: user.id,
      p_feature: feature,
    })

    if (error) {
      logger.error(error, {
        message: 'Erro ao verificar acesso ao recurso.',
        context: { feature },
        showToast: false,
      })
      return { allowed: false, reason: 'error' }
    }

    return data
  }

  const checkUsageLimit = async (resource: 'clients' | 'team_members') => {
    if (!user) return { allowed: false, reason: 'not_authenticated' }

    const { data, error } = await supabase.rpc('check_usage_limit', {
      p_user_id: user.id,
      p_resource: resource,
    })

    if (error) {
      logger.error(error, {
        message: 'Erro ao verificar limite de uso.',
        context: { resource },
        showToast: false,
      })
      return { allowed: false, reason: 'error' }
    }

    return data
  }

  const createCheckoutSession = useMutation({
    mutationFn: async (planType: string) => {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            plan_type: planType,
            user_id: user?.id,
          },
        },
      )

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url
      }
    },
    onError: (error: Error) => {
      logger.error(error, 'usePlanAccess.createCheckoutSession')
      toast.error('Não conseguimos abrir o checkout. Tente de novo em instantes.')
    },
  })

  const hasFeature = (feature: string): boolean => {
    if (!planData?.features) return false
    return !!planData.features[feature]
  }

  const isTrialing =
    planData?.plan_status === 'trialing' &&
    planData?.trial_ends_at &&
    new Date(planData.trial_ends_at) > new Date()

  const isActive = planData?.plan_status === 'active' || isTrialing

  return {
    planType: planData?.plan_type || 'essencial',
    planStatus: planData?.plan_status,
    features: planData?.features || {},
    limits: planData?.limits || {},
    isTrialing,
    isActive,
    trialDaysRemaining:
      isTrialing && planData?.trial_ends_at
        ? Math.ceil(
            (new Date(planData.trial_ends_at).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          )
        : 0,
    hasFeature,
    checkFeatureAccess,
    checkUsageLimit,
    createCheckoutSession,
    isLoading,
  }
}
