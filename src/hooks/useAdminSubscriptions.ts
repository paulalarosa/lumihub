import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface SubscriptionUser {
    id: string;
    full_name: string | null;
    email: string | null;
    plan: string | null;
    created_at: string | null;
}

export interface SubscriptionStats {
    mrr: number;
    activeSubscribers: number;
    churnRate: string;
    growth: string;
}

const PLAN_PRICES = {
    free: 0,
    starter: 29.90,
    pro: 59.90,
    empire: 99.90
};

export function useAdminSubscriptions() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<SubscriptionUser[]>([]);
    const [stats, setStats] = useState<SubscriptionStats>({
        mrr: 0,
        activeSubscribers: 0,
        churnRate: '0%',
        growth: '+0%'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const calculateStats = (profiles: SubscriptionUser[]) => {
        let mrr = 0;
        let subscribers = 0;

        profiles.forEach(user => {
            const plan = (user.plan || 'free').toLowerCase();
            const price = PLAN_PRICES[plan as keyof typeof PLAN_PRICES] || 0;
            if (price > 0) {
                mrr += price;
                subscribers++;
            }
        });

        setStats({
            mrr,
            activeSubscribers: subscribers,
            churnRate: '2.4%', // Placeholder
            growth: '+12.5%' // Placeholder
        });
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (profiles) {
                setUsers(profiles);
                calculateStats(profiles);
            }
        } catch (error) {
            logger.error(error, {
                message: 'Erro ao carregar dados de assinaturas.',
                showToast: false
            });
            toast({
                title: "Erro ao carregar dados",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePlan = async (userId: string, newPlan: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ plan: newPlan })
                .eq('id', userId);

            if (error) throw error;

            toast({
                title: "Plano atualizado",
                description: `Usuário alterado para ${newPlan}`
            });

            fetchData();
        } catch (error) {
            toast({
                title: "Erro ao atualizar plano",
                variant: "destructive"
            });
        }
    };

    return {
        users,
        stats,
        loading,
        handleUpdatePlan,
        refresh: fetchData
    };
}
