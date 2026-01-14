import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export const ContractService = {
    async list(projectId: string) {
        return await supabase
            .from('contracts')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
    },

    async create(contract: Database['public']['Tables']['contracts']['Insert']) {
        return await supabase
            .from('contracts')
            .insert(contract)
            .select()
            .single();
    },

    async update(id: string, updates: Database['public']['Tables']['contracts']['Update']) {
        return await supabase
            .from('contracts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
    },

    async get(id: string) {
        return await supabase
            .from('contracts')
            .select('*')
            .eq('id', id)
            .single();
    }
};
