import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'

export interface SubscriptionUser {
  id: string
  full_name: string | null
  email: string | null
  plan: string | null
  subscription_status: string | null
  created_at: string | null
}

export interface SubscriptionStats {
  mrr: number
  activeSubscribers: number
  churnRate: string
  growth: string
}

export function useAdminSubscriptions() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const statsQuery = useQuery({
    queryKey: ['admin-subscription-stats'],
    queryFn: async (): Promise<SubscriptionStats> => {
      const { data, error } = await (supabase.rpc as any)(
        'get_admin_subscription_stats',
      )
      if (error) {
        logger.error('useAdminSubscriptions.fetchStats', error)
        throw error
      }

      const raw = data as {
        mrr: number
        active_subscribers: number
        churn_rate: number
        growth: number
      }

      return {
        mrr: raw.mrr,
        activeSubscribers: raw.active_subscribers,
        churnRate: `${raw.churn_rate}%`,
        growth: `${raw.growth >= 0 ? '+' : ''}${raw.growth}%`,
      }
    },
    staleTime: 1000 * 60 * 3,
  })

  const usersQuery = useQuery({
    queryKey: ['admin-subscription-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, plan, subscription_status, created_at')
        .neq('role', 'admin')
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('useAdminSubscriptions.fetchUsers', error)
        throw error
      }
      return data as SubscriptionUser[]
    },
  })

  const updatePlanMutation = useMutation({
    mutationFn: async ({
      userId,
      newPlan,
    }: {
      userId: string
      newPlan: string
    }) => {
      const { data, error } = await (supabase.rpc as any)(
        'admin_update_user_plan',
        {
          p_user_id: userId,
          p_new_plan: newPlan,
        },
      )
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      const result = data as {
        user_name?: string
        old_plan?: string
        new_plan?: string
      } | null
      toast({
        title: 'Plano atualizado',
        description: `${result?.user_name}: ${result?.old_plan} → ${result?.new_plan}`,
      })
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
    },
    onError: (error) => {
      logger.error('useAdminSubscriptions.updatePlan', error)
      toast({
        title: 'Erro ao atualizar plano',
        variant: 'destructive',
      })
    },
  })

  const handleUpdatePlan = (userId: string, newPlan: string) => {
    updatePlanMutation.mutate({ userId, newPlan })
  }

  return {
    users: usersQuery.data || [],
    stats: statsQuery.data || {
      mrr: 0,
      activeSubscribers: 0,
      churnRate: '0%',
      growth: '+0%',
    },
    loading: statsQuery.isLoading || usersQuery.isLoading,
    handleUpdatePlan,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-users'] })
    },
  }
}
