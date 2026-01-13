import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AssistantInvite {
    id: string;
    email: string;
    token: string;
    status: 'pending' | 'accepted' | 'revoked';
    created_at: string;
}

export const useAssistant = () => {
    const { user } = useAuth();
    const [invites, setInvites] = useState<AssistantInvite[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchInvites = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('assistant_invites' as any)
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInvites(data || []);
        } catch (error) {
            console.error('Error fetching invites:', error);
            toast.error('Erro ao carregar convites');
        } finally {
            setLoading(false);
        }
    };

    const sendInvite = async (email: string) => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Check if already invited
            const { data: existing } = await supabase
                .from('assistant_invites' as any)
                .select('id')
                .eq('email', email)
                .eq('status', 'pending')
                .maybeSingle();

            if (existing) {
                toast.error('Este email já possui um convite pendente.');
                setLoading(false);
                return;
            }

            // 2. Insert Invite
            const { error: insertError } = await supabase
                .from('assistant_invites' as any)
                .insert([{
                    email,
                    owner_id: user.id
                }]);

            if (insertError) throw insertError;

            toast.success(`Convite enviado para ${email}`);
            fetchInvites();
        } catch (error) {
            console.error('Error sending invite:', error);
            toast.error('Erro ao enviar convite');
        } finally {
            setLoading(false);
        }
    };

    const revokeInvite = async (id: string) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('assistant_invites' as any)
                .update({ status: 'revoked' })
                .eq('id', id);

            if (error) throw error;
            toast.success('Convite revogado');
            fetchInvites();
        } catch (error) {
            console.error('Error revoking invite:', error);
            toast.error('Erro ao revogar convite');
        } finally {
            setLoading(false);
        }
    };

    return {
        invites,
        loading,
        fetchInvites,
        sendInvite,
        revokeInvite
    };
};
