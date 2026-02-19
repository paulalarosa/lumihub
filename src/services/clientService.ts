import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';
import { OriginStat } from '@/types/service-types';
import { logger } from '@/utils/logger';

export interface Client {
    id: string;
    user_id: string | null;
    name: string;
    full_name: string;
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

export const ClientService = {
    async list(organizationId: string) {
        try {
            const { data, error } = await supabase
                .from('wedding_clients')
                .select('id, full_name, name:full_name, email, phone, notes, instagram, origin, created_at, user_id, assistant_commission, parent_user_id, is_bride, access_pin, portal_link')
                .eq('user_id', organizationId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error: unknown) {
            logger.error(error, {
                message: "Erro ao carregar lista de clientes.",
                context: { organizationId },
                showToast: false
            });
            return [];
        }
    },

    async get(id: string) {
        try {
            const { data, error } = await supabase
                .from('wedding_clients')
                .select('*') // Using * to get all fields including new ones
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error(error, { message: "Erro ao buscar cliente." });
            throw error;
        }
    },

    async create(client: Database['public']['Tables']['wedding_clients']['Insert']) {
        try {
            const { data, error } = await supabase
                .from('wedding_clients')
                .insert(client)
                .select()
                .single();

            if (error) throw error;
            logger.success("Cliente cadastrada com sucesso!");
            return data;
        } catch (error) {
            logger.error(error, {
                message: "Erro ao cadastrar cliente. Verifique os dados.",
                context: { clientName: client.full_name }
            });
            throw error;
        }
    },

    async update(id: string, updates: Database['public']['Tables']['wedding_clients']['Update']) {
        try {
            const { data, error } = await supabase
                .from('wedding_clients')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error(error, { message: "Erro ao atualizar cliente." });
            throw error;
        }
    },

    async delete(id: string) {
        try {
            const { error } = await supabase
                .from('wedding_clients')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            logger.error(error, { message: "Erro ao deletar cliente." });
            throw error;
        }
    },

    async count(organizationId: string) {
        const { count } = await supabase
            .from('wedding_clients')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', organizationId);
        return count || 0;
    },

    async getOriginStats(organizationId: string): Promise<OriginStat[]> {
        try {
            const { data, error } = await supabase
                .from('wedding_clients')
                .select('origin')
                .eq('user_id', organizationId);

            if (error) throw error;

            const stats: Record<string, number> = {};

            if (data) {
                data.forEach((client) => {
                    const origin = client.origin || 'Desconhecido';
                    const key = origin.charAt(0).toUpperCase() + origin.slice(1);
                    stats[key] = (stats[key] || 0) + 1;
                });
            }

            return Object.entries(stats).map(([name, value]) => ({ name, value }));
        } catch (error) {
            logger.error(error, { message: "Erro ao calcular estatísticas." });
            return [];
        }
    }
};
