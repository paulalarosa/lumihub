import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { useAnalytics } from '@/hooks/useAnalytics'
import { toast } from 'sonner'
import { logger } from '@/services/logger'
import { enforceRateLimit, RateLimitError } from '@/lib/rateLimit'

export type CancelAction = 'cancel_at_period_end' | 'cancel_immediately' | 'reactivate'

export interface BillingSubscription {
  planType: string
  planStatus: string | null
  planStartedAt: string | null
  planExpiresAt: string | null
  trialEndsAt: string | null
  monthlyPrice: number | null
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  isTrialing: boolean
  isActive: boolean
  trialDaysRemaining: number
  planConfig: {
    display_name: string
    monthly_price: number
    max_clients: number | null
    max_team_members: number
    max_projects_per_month: number | null
    features: Record<string, unknown>
  } | null
}

export interface BillingInvoice {
  id: string
  invoice_number: string | null
  amount: number
  status: string | null
  created_at: string
  due_date: string | null
  paid_at: string | null
}

export interface BillingUsage {
  clientsUsed: number
  assistantsUsed: number
  projectsThisMonth: number
}

export function useBilling() {
  const { organizationId } = useOrganization()

  return useQuery({
    queryKey: ['billing', 'subscription', organizationId],
    queryFn: async (): Promise<BillingSubscription | null> => {
      if (!organizationId) return null

      const { data, error } = await supabase
        .from('makeup_artists')
        .select('*, plan_config:plan_configs(*)')
        .eq('user_id', organizationId)
        .maybeSingle()

      if (error) throw error
      if (!data) return null

      const trialEndsAt = data.trial_ends_at
      const isTrialing =
        data.plan_status === 'trialing' &&
        !!trialEndsAt &&
        new Date(trialEndsAt) > new Date()
      const isActive = data.plan_status === 'active' || isTrialing
      const trialDaysRemaining =
        isTrialing && trialEndsAt
          ? Math.max(
              0,
              Math.ceil(
                (new Date(trialEndsAt).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
          : 0

      return {
        planType: data.plan_type ?? 'essencial',
        planStatus: data.plan_status,
        planStartedAt: data.plan_started_at,
        planExpiresAt: data.plan_expires_at,
        trialEndsAt,
        monthlyPrice: data.monthly_price,
        stripeSubscriptionId: data.stripe_subscription_id,
        stripeCustomerId: data.stripe_customer_id,
        isTrialing,
        isActive,
        trialDaysRemaining,
        planConfig: data.plan_config
          ? {
              display_name: data.plan_config.display_name,
              monthly_price: data.plan_config.monthly_price,
              max_clients: data.plan_config.max_clients,
              max_team_members: data.plan_config.max_team_members,
              max_projects_per_month: data.plan_config.max_projects_per_month,
              features: (data.plan_config.features as Record<string, unknown>) ?? {},
            }
          : null,
      }
    },
    enabled: !!organizationId,
  })
}

export function useBillingInvoices() {
  const { organizationId } = useOrganization()

  return useQuery({
    queryKey: ['billing', 'invoices', organizationId],
    queryFn: async (): Promise<BillingInvoice[]> => {
      if (!organizationId) return []

      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, amount, status, created_at, due_date, paid_at')
        .eq('user_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data ?? []
    },
    enabled: !!organizationId,
  })
}

export function useBillingUsage() {
  const { organizationId } = useOrganization()

  return useQuery({
    queryKey: ['billing', 'usage', organizationId],
    queryFn: async (): Promise<BillingUsage> => {
      if (!organizationId) return { clientsUsed: 0, assistantsUsed: 0, projectsThisMonth: 0 }

      const monthStart = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      ).toISOString()

      const [clients, assistants, projects] = await Promise.all([
        supabase
          .from('wedding_clients')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', organizationId),
        supabase
          .from('assistants')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', organizationId),
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', organizationId)
          .gte('created_at', monthStart),
      ])

      return {
        clientsUsed: clients.count ?? 0,
        assistantsUsed: assistants.count ?? 0,
        projectsThisMonth: projects.count ?? 0,
      }
    },
    enabled: !!organizationId,
  })
}

export function useCancelSubscription() {
  const queryClient = useQueryClient()
  const { organizationId } = useOrganization()
  const { user } = useAuth()
  const { trackSubscription } = useAnalytics()

  return useMutation({
    mutationFn: async (action: CancelAction) => {
      enforceRateLimit(`cancel-subscription:${organizationId ?? 'anon'}`, 3, 60_000)
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { action },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'subscription', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['plan-access', user?.id] })

      if (action === 'reactivate') {
        toast.success('Assinatura reativada com sucesso.')
      } else if (action === 'cancel_immediately') {
        trackSubscription('cancel')
        toast.success('Assinatura cancelada imediatamente.')
      } else {
        trackSubscription('cancel')
        toast.success('Cancelamento agendado para o fim do período atual.')
      }
    },
    onError: (error: Error) => {
      if (error instanceof RateLimitError) {
        const seconds = Math.ceil(error.retryAfterMs / 1000)
        toast.error(`Muitas tentativas. Aguarde ${seconds}s.`)
        return
      }
      logger.error(error, 'useCancelSubscription')
      toast.error('Não foi possível processar a solicitação.')
    },
  })
}
