import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export const ProjectService = {
    async list(userId: string) {
        return await supabase
            .from('projects')
            .select(`
        *,
        client:clients(*)
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
    },

    async get(id: string) {
        return await supabase
            .from('projects')
            .select(`
        *,
        client:clients(*),
        invoices(*),
        contracts(*)
      `)
            .eq('id', id)
            .single();
    },

    async create(project: Database['public']['Tables']['projects']['Insert']) {
        return await supabase
            .from('projects')
            .insert(project)
            .select()
            .single();
    },

    async update(id: string, updates: Database['public']['Tables']['projects']['Update']) {
        return await supabase
            .from('projects')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
    },

    async delete(id: string) {
        return await supabase
            .from('projects')
            .delete()
            .eq('id', id);
    }
};
