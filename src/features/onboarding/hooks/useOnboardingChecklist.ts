import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'

export type ChecklistStepId =
  | 'profile'
  | 'services'
  | 'calendar'
  | 'first_client'
  | 'first_project'
  | 'instagram'

export interface ChecklistStep {
  id: ChecklistStepId
  label: string
  description: string
  done: boolean
  href: string
}

export interface OnboardingChecklistState {
  steps: ChecklistStep[]
  completed: number
  total: number
  percentage: number
  isAllDone: boolean
  isDismissed: boolean
}

export function useOnboardingChecklist() {
  const { user } = useAuth()
  const { organizationId, isOwner } = useOrganization()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['onboarding-checklist', organizationId, user?.id],
    queryFn: async (): Promise<OnboardingChecklistState> => {
      if (!organizationId || !user?.id) {
        return emptyState()
      }

      const [onboarding, profile, services, calendar, clients, projects, instagram] =
        await Promise.all([
          supabase
            .from('user_onboarding')
            .select('is_completed, has_seen_tour')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('full_name, bio, business_name, phone')
            .eq('id', organizationId)
            .maybeSingle(),
          supabase
            .from('services')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', organizationId),
          supabase
            .from('google_calendar_tokens')
            .select('id', { head: true, count: 'exact' })
            .eq('user_id', user.id),
          supabase
            .from('wedding_clients')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', organizationId),
          supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', organizationId),
          supabase
            .from('instagram_connections')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', organizationId),
        ])

      const profileDone =
        !!(profile.data?.bio && profile.data?.business_name && profile.data?.phone)
      const servicesDone = (services.count ?? 0) > 0
      const calendarDone = (calendar.count ?? 0) > 0
      const clientDone = (clients.count ?? 0) > 0
      const projectDone = (projects.count ?? 0) > 0
      const instagramDone = (instagram.count ?? 0) > 0

      const steps: ChecklistStep[] = [
        {
          id: 'profile',
          label: 'Complete seu perfil',
          description: 'Nome, bio, telefone — aparecem no seu link público',
          done: profileDone,
          href: '/configuracoes',
        },
        {
          id: 'services',
          label: 'Cadastre seus serviços',
          description: 'Pacotes que você oferece, com duração e preço',
          done: servicesDone,
          href: '/servicos',
        },
        {
          id: 'calendar',
          label: 'Conecte o Google Calendar',
          description: 'Eventos sincronizam automaticamente nos dois sentidos',
          done: calendarDone,
          href: '/integracoes',
        },
        {
          id: 'first_client',
          label: 'Cadastre sua primeira cliente',
          description: 'Real ou fictícia — para testar o portal da noiva',
          done: clientDone,
          href: '/clientes',
        },
        {
          id: 'first_project',
          label: 'Crie seu primeiro projeto',
          description: 'Organize serviços, cronograma e pagamentos',
          done: projectDone,
          href: '/clientes',
        },
        {
          id: 'instagram',
          label: 'Conecte o Instagram',
          description: 'Seus posts aparecem no microsite automaticamente',
          done: instagramDone,
          href: '/integracoes',
        },
      ]

      const completed = steps.filter((s) => s.done).length
      const total = steps.length
      const isAllDone = completed === total
      const isDismissed = !!onboarding.data?.is_completed

      return {
        steps,
        completed,
        total,
        percentage: Math.round((completed / total) * 100),
        isAllDone,
        isDismissed,
      }
    },
    enabled: !!user && !!organizationId && isOwner,
    staleTime: 60_000,
  })

  const dismissMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return
      await supabase
        .from('user_onboarding')
        .upsert(
          {
            user_id: user.id,
            is_completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-checklist'] })
    },
  })

  return {
    data: query.data,
    loading: query.isLoading,
    dismiss: () => dismissMutation.mutate(),
    isDismissing: dismissMutation.isPending,
  }
}

function emptyState(): OnboardingChecklistState {
  return {
    steps: [],
    completed: 0,
    total: 0,
    percentage: 0,
    isAllDone: false,
    isDismissed: false,
  }
}
