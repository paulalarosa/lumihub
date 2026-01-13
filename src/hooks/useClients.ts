import { useState, useEffect } from 'react';
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
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClients = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('clients')
                .select('id, name, email, phone')
                .order('name');

            if (!error && data) {
                setClients(data);
            }
            setLoading(false);
        };

        fetchClients();
    }, [user]);

    return { clients, loading };
}
