import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { AssistantInvite } from '@/types/custom-schema';

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
            setInvites((data as unknown as AssistantInvite[]) || []);
        } catch (error) {
            console.error('Error fetching invites:', error);
            toast.error('Erro ao carregar convites');
        } finally {
            setLoading(false);
        }
    };

    const sendInvite = async (email: string) => {
        if (!user) {
            console.error("Assistant Hook: No user logged in.");
            toast.error("Você precisa estar logado.");
            return;
        }

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

            const namePart = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
            const randomPart = Math.random().toString(36).substring(2, 6);
            const inviteCode = `${namePart}-${randomPart}`;

            const payload = {
                email,
                owner_id: user.id,
                invite_code: inviteCode
            };


            const { data, error: insertError } = await supabase
                .from('assistant_invites' as any)
                .insert([payload])
                .select()
                .single();

            if (insertError) throw insertError;

            toast.success(`Convite enviado para ${email}`);
            fetchInvites();
            return data;
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
