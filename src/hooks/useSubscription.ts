import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { supabase, handleSupabaseError } from '@/integrations/supabase/client'
import { differenceInDays } from 'date-fns/differenceInDays'
import { parseISO } from 'date-fns/parseISO'

import { handleError } from '@/lib/error-handling'

export type SubscriptionStatus = 'trialing' | 'active' | 'expired'
export type PlanType = 'free' | 'pro' | 'empire' | 'studio'

export interface SubscriptionState {
  plan: PlanType
  status: SubscriptionStatus
  daysRemaining: number
  isLoading: boolean
}

export const useSubscription = () => {
  const { user } = useAuth()
  const [state, setState] = useState<SubscriptionState>({
    plan: 'free',
    status: 'trialing',
    daysRemaining: 7,
    isLoading: true,
  })

  useEffect(() => {
    if (!user) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return
    }

    const checkSubscription = async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('created_at, role, subscription_tier')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          handleSupabaseError(error)
          throw error
        }

        if (!profile) {
          setState((prev) => ({ ...prev, isLoading: false }))
          return
        }

        const p = profile
        const plan = (p.subscription_tier as PlanType) || 'free'
        const createdAt = p.created_at ? parseISO(p.created_at) : new Date()
        const daysActive = differenceInDays(new Date(), createdAt)
        const TRIAL_DAYS = 7
        const daysRemaining = Math.max(0, TRIAL_DAYS - daysActive)

        let status: SubscriptionStatus = 'trialing'

        if (
          p.role === 'admin' ||
          plan === 'pro' ||
          plan === 'empire' ||
          plan === 'studio'
        ) {
          status = 'active'
        } else {
          if (daysActive > TRIAL_DAYS) {
            status = 'expired'
          } else {
            status = 'trialing'
          }
        }

        setState({
          plan,
          status,
          daysRemaining: status === 'trialing' ? daysRemaining : 0,
          isLoading: false,
        })
      } catch (error) {
        handleError(error, 'useSubscription')
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    }

    checkSubscription()
  }, [user])

  return state
}
