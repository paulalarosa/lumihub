import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { OriginStat } from '@/types/service-types';

export interface Client {
    id: string;
    user_id: string | null;
    name: string;
    full_name: string; // Added to match query
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
                .from('wedding_clients')
                .select('id, full_name, name:full_name, email, phone, notes, instagram, origin, created_at, user_id, assistant_commission, parent_user_id, is_bride, access_pin, portal_link')
                .eq('user_id', organizationId)
                .order('created_at', { ascending: false });
        } catch (error: unknown) {
            console.error("ClientService List Error:", error);
            // Return empty array on crash to prevent white screen
            return { data: [], error: error as Error };
        }
    },

    async get(id: string) {
        // RLS will handle the check, but good to be explicit if we wanted.
        // For 'get', id is unique enough, but ensuring it belongs to org is better conceptually.
        // However, standard pattern:
        return await supabase
            .from('wedding_clients')
            .select('id, full_name, name:full_name, email, phone, notes, instagram, origin, created_at, user_id, assistant_commission, parent_user_id, is_bride, access_pin, portal_link')
            .eq('id', id)
            .single();
    },

    async create(client: Database['public']['Tables']['wedding_clients']['Insert']) {
        return await supabase
            .from('wedding_clients')
            .insert(client)
            .select()
            .single();
    },

    async update(id: string, updates: Database['public']['Tables']['wedding_clients']['Update']) {
        return await supabase
            .from('wedding_clients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
    },

    async delete(id: string) {
        return await supabase
            .from('wedding_clients')
            .delete()
            .eq('id', id);
    },

    async count(organizationId: string) {
        const { count } = await supabase
            .from('wedding_clients')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', organizationId);
        return count || 0;
    },

    // treatment_records methods removed
    async getTreatmentRecords(clientId: string) { return { data: [], error: null }; },
    async deleteTreatmentRecord(recordId: string) { },

    async getOriginStats(organizationId: string): Promise<OriginStat[]> {
        const { data, error } = await supabase
            .from('wedding_clients')
            .select('origin')
            .eq('user_id', organizationId);

        if (error) throw error;

        // Count occurrences of each origin
        const stats: Record<string, number> = {};

        if (data) {
            data.forEach((client) => {
                const origin = client.origin || 'Desconhecido';
                const key = origin.charAt(0).toUpperCase() + origin.slice(1);
                stats[key] = (stats[key] || 0) + 1;
            });
        }

        return Object.entries(stats).map(([name, value]) => ({ name, value }));
    }
};
