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
    is_bride?: boolean;
    access_pin?: string | null;
    portal_link?: string | null;
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
        try {
            return await supabase
                .from('wedding_clients' as any)
                .select('id, full_name, name:full_name, email, phone, notes, instagram, origin, created_at, user_id, assistant_commission, parent_user_id, is_bride, access_pin, portal_link')
                .eq('user_id', organizationId)
                .order('created_at', { ascending: false });
        } catch (error: any) {
            console.error("ClientService List Error:", error);
            // Return empty array on crash to prevent white screen
            return { data: [], error };
        }
    },

    async get(id: string) {
        // RLS will handle the check, but good to be explicit if we wanted.
        // For 'get', id is unique enough, but ensuring it belongs to org is better conceptually.
        // However, standard pattern:
        return await supabase
            .from('wedding_clients' as any)
            .select('id, full_name, name:full_name, email, phone, notes, instagram, origin, created_at, user_id, assistant_commission, parent_user_id, is_bride, access_pin, portal_link')
            .eq('id', id)
            .single();
    },

    async create(client: any) {
        return await supabase
            .from('wedding_clients' as any)
            .insert(client)
            .select()
            .single();
    },

    async update(id: string, updates: any) {
        return await supabase
            .from('wedding_clients' as any)
            .update(updates)
            .eq('id', id)
            .select()
            .single();
    },

    async delete(id: string) {
        return await supabase
            .from('wedding_clients' as any)
            .delete()
            .eq('id', id);
    },

    async count(organizationId: string) {
        const { count } = await supabase
            .from('wedding_clients' as any)
            .select('id', { count: 'exact', head: true })
            .eq('user_id', organizationId);
        return count || 0;
    },

    // treatment_records methods removed
    async getTreatmentRecords(clientId: string) { return { data: [], error: null }; },
    async deleteTreatmentRecord(recordId: string) { },

    async getOriginStats(organizationId: string) {
        const { data, error } = await supabase
            .from('wedding_clients' as any)
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
