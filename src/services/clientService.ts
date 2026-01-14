import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/app';
import { Database } from '@/integrations/supabase/types';

export const ClientService = {
    async list(userId: string) {
        return await supabase
            .from('clients')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
    },

    async get(id: string) {
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
    }
};
