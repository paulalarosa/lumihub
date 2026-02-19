import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
}

export function useClients() {
    const { user } = useAuth();

    const { data: clients = [], isLoading: loading } = useQuery({
        queryKey: ['clients', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('wedding_clients')
                .select('id, name, email, phone')
                .order('name');

            if (error) throw error;
            return data;
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return { clients, loading };
}
