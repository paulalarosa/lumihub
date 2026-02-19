import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export const useChatHistory = (conversationId?: string) => {
    const queryClient = useQueryClient();

    // 1. Busca o histórico com cache inteligente
    const chatQuery = useQuery({
        queryKey: ["chat-history", conversationId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("chat_history")
                .select("*")
                .eq("conversation_id", conversationId!)
                .order("created_at", { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!conversationId,
        staleTime: 1000 * 60 * 5,
    });

    const sendMessage = useMutation({
        mutationFn: async (content: string) => {
            const { data, error } = await supabase.functions.invoke("ai-chat-advanced", {
                body: { content, conversationId: conversationId! },
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chat-history", conversationId] });
        },
        onError: (err) => {
            logger.error(err, { area: "AI-Chat", message: "Erro ao enviar mensagem." });
        }
    });

    return { ...chatQuery, sendMessage };
};