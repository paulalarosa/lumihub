import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export const ProjectService = {
    async list(organizationId: string) {
        return await supabase
            .from('projects')
            .select(`
        *,
        client:clients(*)
      `)
            .eq('user_id', organizationId)
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
    },

    async count(organizationId: string) {
        const { count } = await supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', organizationId);
        return count || 0;
    },

    // Tasks
    async getTasks(projectId: string) {
        return await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('sort_order');
    },
    async createTask(task: any) {
        return await supabase.from('tasks').insert(task).select().single();
    },
    async updateTask(id: string, updates: any) {
        return await supabase.from('tasks').update(updates).eq('id', id);
    },
    async deleteTask(id: string) {
        return await supabase.from('tasks').delete().eq('id', id);
    },

    // Briefings
    async getBriefing(projectId: string) {
        return await supabase.from('briefings').select('*').eq('project_id', projectId).maybeSingle();
    },
    async createBriefing(briefing: any) {
        return await supabase.from('briefings').insert(briefing).select().single();
    },

    // Contracts
    async getContracts(projectId: string) {
        return await supabase.from('contracts').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    },
    async createContract(contract: any) {
        return await supabase.from('contracts').insert(contract).select().single();
    },

    // Services (Catalog)
    async getCatalogServices() {
        return await supabase.from('services').select('*').eq('is_active', true).order('sort_order');
    },

    // Project Services (Financial)
    async getProjectServices(projectId: string) {
        return await supabase
            .from('project_services')
            .select('*, service:services(id, name, description, price)')
            .eq('project_id', projectId)
            .order('created_at');
    },
    async addProjectService(data: any) {
        return await supabase.from('project_services').insert(data).select().single();
    },
    async deleteProjectService(id: string) {
        return await supabase.from('project_services').delete().eq('id', id);
    },
    async updateProjectService(id: string, updates: any) {
        return await supabase.from('project_services').update(updates).eq('id', id);
    }
};
