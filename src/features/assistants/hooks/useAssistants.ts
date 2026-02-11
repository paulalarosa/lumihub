
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Assistant {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    is_registered: boolean;
    invite_token: string;
    created_at: string;
}

export const useAssistants = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const fetchAssistants = async () => {
        const { data, error } = await supabase
            .from('assistants')
            .select('*')
            .order('name');

        if (error) throw error;
        return data as Assistant[];
    };

    const query = useQuery({
        queryKey: ['assistants'],
        queryFn: fetchAssistants,
    });

    const createMutation = useMutation({
        mutationFn: async (vars: { name: string, email: string | null, phone: string | null }) => {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user) throw new Error("User not authenticated");

            const token = crypto.randomUUID();
            const { error } = await supabase.from('assistants').insert({
                user_id: userData.user.id,
                name: vars.name,
                email: vars.email,
                phone: vars.phone,
                invite_token: token
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assistants'] });
            toast({ title: "Sucesso", description: "Assistente cadastrada" });
        },
        onError: (error) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (vars: { id: string, name: string, email: string | null, phone: string | null }) => {
            const { error } = await supabase.from('assistants').update({
                name: vars.name,
                email: vars.email,
                phone: vars.phone
            }).eq('id', vars.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assistants'] });
            toast({ title: "Sucesso", description: "Assistente atualizada" });
        },
        onError: (error) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('assistants').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assistants'] });
            toast({ title: "Sucesso", description: "Assistente excluída" });
        },
        onError: (error) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    return {
        assistants: query.data || [],
        isLoading: query.isLoading,
        createAssistant: createMutation.mutateAsync,
        updateAssistant: updateMutation.mutateAsync,
        deleteAssistant: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending
    };
};
