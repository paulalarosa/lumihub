import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/utils/logger';

export const useDeleteClient = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            // Using 'wedding_clients' as confirmed in previous steps
            const { error } = await supabase
                .from('wedding_clients')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            // Invalidate to refetch list
            queryClient.invalidateQueries({ queryKey: ['clients'] });

            toast({
                title: "CLIENTE REMOVIDO",
                description: "O registro foi apagado do sistema com sucesso.",
            });
        },
        onError: (error) => {
            logger.error(error, 'useDeleteClient.onError', { showToast: false });
            toast({
                variant: "destructive",
                title: "ERRO DE REMOÇÃO",
                description: "Não foi possível completar a operação. Tente novamente.",
            });
        }
    });
};
