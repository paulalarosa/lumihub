import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export interface Client {
    id: string;
    user_id: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    instagram: string | null;
    notes: string | null;
    origin: string | null;
    created_at: string;
}

export interface TreatmentRecord {
    id: string;
    client_id: string;
    date: string;
    description: string | null;
    notes: string | null;
    created_at: string;
}

export const ClientService = {
    async list(organizationId: string) {
        return await supabase
            .from('clients')
            .select('*')
            .eq('user_id', organizationId)
            .order('created_at', { ascending: false });
    },

    async get(id: string) {
        // RLS will handle the check, but good to be explicit if we wanted.
        // For 'get', id is unique enough, but ensuring it belongs to org is better conceptually.
        // However, standard pattern:
        return await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single();
    },

    async create(client: Database['public']['Tables']['clients']['Insert']) {
        return await supabase
            .from('clients')
            .insert(client)
            .select()
            .single();
    },

    async update(id: string, updates: Database['public']['Tables']['clients']['Update']) {
        return await supabase
            .from('clients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
    },

    async delete(id: string) {
        return await supabase
            .from('clients')
            .delete()
            .eq('id', id);
    },

    async count(organizationId: string) {
        const { count } = await supabase
            .from('clients')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', organizationId);
        return count || 0;
    },

    // treatment_records methods removed
    async getTreatmentRecords(clientId: string) { return { data: [], error: null }; },
    async deleteTreatmentRecord(recordId: string) { },

    async getOriginStats(organizationId: string) {
        const { data, error } = await supabase
            .from('clients')
            .select('origin')
            .eq('user_id', organizationId);

        if (error) throw error;

        const stats = (data as any[] || []).reduce((acc: Record<string, number>, curr) => {
            const origin = curr.origin || 'Desconhecido';
            const key = origin.charAt(0).toUpperCase() + origin.slice(1);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(stats).map(([name, value]) => ({ name, value }));
    }
};
