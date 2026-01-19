import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { differenceInDays, parseISO } from 'date-fns';

export type SubscriptionStatus = 'trialing' | 'active' | 'expired';
export type PlanType = 'free' | 'pro' | 'empire' | 'studio';

export interface SubscriptionState {
    plan: PlanType;
    status: SubscriptionStatus;
    daysRemaining: number; // For trial
    isLoading: boolean;
}

export const useSubscription = () => {
    const { user } = useAuth();
    const [state, setState] = useState<SubscriptionState>({
        plan: 'free',
        status: 'trialing',
        daysRemaining: 7,
        isLoading: true
    });

    useEffect(() => {
        if (!user) {
            setState(prev => ({ ...prev, isLoading: false }));
            return;
        }

        const checkSubscription = async () => {
            try {
                // Safely select only guaranteed columns. If 'plan' is missing in DB, we default to 'free' below.
                // We do NOT select 'plan' here to avoid 400 error if column is missing.
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('created_at, role, subscription_tier')
                    .eq('id', user.id)
                    .maybeSingle(); // Prevent PGRST116 (406) error if no rows found

                if (error) {
                    handleSupabaseError(error);
                    throw error;
                }

                // If no profile found (e.g. very early auth state), return safe defaults without crashing
                if (!profile) {
                    console.warn("useSubscription: No profile found for user, using defaults.");
                    setState(prev => ({ ...prev, isLoading: false }));
                    return;
                }

                const p = profile as any;
                let plan = (p.subscription_tier as PlanType) || 'free'; // Use subscription_tier if available
                const createdAt = p.created_at ? parseISO(p.created_at) : new Date();
                const daysActive = differenceInDays(new Date(), createdAt);
                const TRIAL_DAYS = 7;
                const daysRemaining = Math.max(0, TRIAL_DAYS - daysActive);

                let status: SubscriptionStatus = 'trialing';

                // Priority 1: Admin or Paid Plan
                // Removed hardcoded email bypasses as per Security Enforcement Protocol

                if ((p.role === 'admin') || (plan === 'pro') || (plan === 'empire') || (plan === 'studio')) {
                    status = 'active';
                } else {
                    // Priority 2: Free Plan (Trial Logic)
                    if (daysActive > TRIAL_DAYS) {
                        status = 'expired';
                    } else {
                        status = 'trialing';
                    }
                }

                setState({
                    plan,
                    status,
                    daysRemaining: status === 'trialing' ? daysRemaining : 0,
                    isLoading: false
                });

            } catch (error) {
                console.error('Error checking subscription:', error);
                // Default to safe state or retry? 
                // For now, let's assume trial to avoid blocking valid users on error
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };

        checkSubscription();
    }, [user]);

    return state;
};
