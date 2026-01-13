import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO } from 'date-fns';

export type SubscriptionStatus = 'trialing' | 'active' | 'expired';
export type PlanType = 'free' | 'pro' | 'empire';

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
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('plan, created_at')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                const p = profile as any;
                const plan = (p.plan as PlanType) || 'free';
                const createdAt = p.created_at ? parseISO(p.created_at) : new Date();
                const daysActive = differenceInDays(new Date(), createdAt);
                const TRIAL_DAYS = 7;
                const daysRemaining = Math.max(0, TRIAL_DAYS - daysActive);

                let status: SubscriptionStatus = 'trialing';

                if (plan !== 'free') {
                    status = 'active'; // Paid plans are always active
                } else {
                    // Free plan logic: Check trial
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
