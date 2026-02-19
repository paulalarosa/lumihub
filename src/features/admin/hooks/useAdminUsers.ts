import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { logger } from "@/utils/logger";

export const useAdminUsers = () => {
    const queryClient = useQueryClient();

    // Busca de usuários com Cache
    const usersQuery = useQuery({
        queryKey: ["admin-users"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Tables<"profiles">[];
        },
    });

    // Mutação para deletar (Exemplo)
    const deleteUser = useMutation({
        mutationFn: async (userId: string) => {
            // Assuming we can delete users, but typically we might soft-delete or block
            // But adhering to the user's example.
            const { error } = await supabase.from("profiles").delete().eq("id", userId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            logger.success("Usuário removido com sucesso!");
        },
        onError: (err) => logger.error(err, "useAdminUsers.deleteUser", { message: "Erro ao deletar usuário" }),
    });

    return { ...usersQuery, deleteUser };
};
