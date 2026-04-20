import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'

export interface MRRStats {
  active_subscribers: number
  in_trial: number
  paying: number
  mrr: number
  arr: number
  arpu: number
}

export interface SignupCohort {
  cohort_month: string
  signups: number
  active_now: number
  trialing_now: number
  churned: number
  paying_now: number
}

export function useAdminMRR() {
  useRealtimeInvalidate({
    table: ['profiles', 'subscriptions'],
    invalidate: [['admin-mrr'], ['admin-cohorts']],
    channelName: 'rt-admin-mrr',
  })

  const stats = useQuery({
    queryKey: ['admin-mrr'],
    queryFn: async (): Promise<MRRStats> => {
      const { data, error } = await supabase
        .from('admin_mrr_stats')
        .select('*')
        .maybeSingle()
      if (error) throw error
      return (
        (data as MRRStats | null) ?? {
          active_subscribers: 0,
          in_trial: 0,
          paying: 0,
          mrr: 0,
          arr: 0,
          arpu: 0,
        }
      )
    },
  })

  const cohorts = useQuery({
    queryKey: ['admin-cohorts'],
    queryFn: async (): Promise<SignupCohort[]> => {
      const { data, error } = await supabase
        .from('admin_signup_cohorts')
        .select('*')
      if (error) throw error
      return (data as SignupCohort[]) ?? []
    },
  })

  return { stats, cohorts }
}
