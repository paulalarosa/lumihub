import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PlanLimits {
    plan_type: 'essencial' | 'profissional' | 'studio';
    max_clients: number | null;
    max_projects_per_month: number | null;
    max_team_members: number | null;
    features: {
        agenda: boolean;
        contratos_digitais: boolean;
        portal_cliente: boolean;
        calendario: boolean;
        galeria: boolean;
        pack_tecnico: 'basico' | 'gold' | 'premium';
        analytics: boolean;
        portal_noiva_custom: boolean;
        microsite: boolean;
        ficha_anamnese: boolean;
        gestao_equipe: boolean;
        ia_operacional: boolean;
        performance_artista: boolean;
        multi_usuario: boolean;
        integracao_api: boolean;
        suporte: 'whatsapp' | 'email' | 'prioritario';
    };
}

export const usePlanAccess = () => {
    const { user } = useAuth();

    const { data: planData, isLoading } = useQuery({
        queryKey: ['plan-access', user?.id],
        queryFn: async () => {
            if (!user) return null;

            // Buscar dados do plano
            const { data: artist, error } = await supabase
                .from('makeup_artists')
                .select('plan_type, plan_status')
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.error('Error fetching artist plan:', error);
                // Fallback to essential if error (e.g. no profile yet)
                return { plan_type: 'essencial', plan_status: 'active', features: {}, max_clients: 50 } as any;
            }

            // Buscar limites do plano
            const { data: limits, error: limitsError } = await supabase
                .from('plan_limits')
                .select('*')
                .eq('plan_type', artist.plan_type)
                .single();

            if (limitsError) {
                console.error('Error fetching plan limits:', limitsError);
                return { ...artist } as any;
            }

            return {
                ...artist,
                ...limits,
            } as PlanLimits & { plan_status: string };
        },
        enabled: !!user,
    });

    const hasFeature = (feature: keyof PlanLimits['features']): boolean => {
        if (!planData) return false;
        // @ts-ignore
        return !!planData.features?.[feature];
    };

    const getRequiredPlan = async (feature: string) => {
        const { data } = await supabase.rpc('get_required_plan', { p_feature: feature });
        return data;
    }

    const canCreateClient = async (): Promise<{ allowed: boolean; message?: string }> => {
        if (!user) return { allowed: false, message: 'Usuário não autenticado' };

        const { data, error } = await supabase.rpc('check_plan_limit', {
            p_user_id: user.id,
            p_feature: 'max_clients',
        });

        if (error) {
            console.error('Plan check error:', error);
            return { allowed: false, message: 'Erro ao verificar plano' };
        }

        if (!data.allowed) {
            if (data.reason === 'limit_reached') {
                return {
                    allowed: false,
                    message: `Limite de ${data.limit} clientes atingido. Faça upgrade para o plano Profissional!`,
                };
            }
            return { allowed: false, message: 'Acesso negado' };
        }

        return { allowed: true };
    };

    const getPlanBadge = () => {
        const badges = {
            essencial: { label: 'Essencial', color: 'bg-gray-500' },
            profissional: { label: 'Profissional', color: 'bg-blue-500' },
            studio: { label: 'Studio', color: 'bg-purple-500' },
        };

        // @ts-ignore
        return badges[planData?.plan_type || 'essencial'];
    };

    return {
        planType: planData?.plan_type || 'essencial',
        planStatus: planData?.plan_status || 'active',
        features: planData?.features || {},
        limits: {
            maxClients: planData?.max_clients,
            maxProjects: planData?.max_projects_per_month,
            maxTeamMembers: planData?.max_team_members,
        },
        hasFeature,
        canCreateClient,
        getPlanBadge,
        getRequiredPlan,
        isLoading,
    };
};
