import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const usePlanAccess = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: planData, isLoading } = useQuery({
        queryKey: ['plan-access', user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from('makeup_artists')
                .select(`
          *,
          plan_config:plan_configs(*)
        `)
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;

            return {
                ...data,
                features: data?.plan_config?.features || {},
                limits: {
                    maxClients: data?.plan_config?.max_clients,
                    maxTeamMembers: data?.plan_config?.max_team_members,
                },
            };
        },
        enabled: !!user,
    });

    const checkFeatureAccess = async (feature: string) => {
        if (!user) return { allowed: false, reason: 'not_authenticated' };

        const { data, error } = await supabase.rpc('check_feature_access', {
            p_user_id: user.id,
            p_feature: feature,
        });

        if (error) {
            console.error('Feature check error:', error);
            return { allowed: false, reason: 'error' };
        }

        return data;
    };

    const checkUsageLimit = async (resource: 'clients' | 'team_members') => {
        if (!user) return { allowed: false, reason: 'not_authenticated' };

        const { data, error } = await supabase.rpc('check_usage_limit', {
            p_user_id: user.id,
            p_resource: resource,
        });

        if (error) {
            console.error('Limit check error:', error);
            return { allowed: false, reason: 'error' };
        }

        return data;
    };

    const createCheckoutSession = useMutation({
        mutationFn: async (planType: string) => {
            const { data, error } = await supabase.functions.invoke('stripe-checkout', {
                body: {
                    plan_type: planType,
                    user_id: user?.id,
                },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            if (data?.url) {
                window.location.href = data.url;
            }
        },
        onError: (error: any) => {
            toast.error('Erro ao criar sessão de pagamento: ' + error.message);
        },
    });

    const hasFeature = (feature: string): boolean => {
        if (!planData?.features) return false;
        // @ts-ignore
        return !!planData.features[feature];
    };

    const isTrialing = planData?.plan_status === 'trialing' &&
        planData?.trial_ends_at &&
        new Date(planData.trial_ends_at) > new Date();

    const isActive = planData?.plan_status === 'active' || isTrialing;

    return {
        planType: planData?.plan_type || 'essencial',
        planStatus: planData?.plan_status,
        features: planData?.features || {},
        limits: planData?.limits || {},
        isTrialing,
        isActive,
        trialDaysRemaining: isTrialing && planData?.trial_ends_at
            ? Math.ceil((new Date(planData.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : 0,
        hasFeature,
        checkFeatureAccess,
        checkUsageLimit,
        createCheckoutSession,
        isLoading,
    };
};
