import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

export const useAssistants = () => {
    useRealtimeInvalidate({
        table: 'assistants',
        invalidate: ['assistants'],
        channelName: 'rt-assistants',
    });

    return useQuery({
        queryKey: ['assistants'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('assistants')
                .select('*');

            if (error) throw error;
            return data;
        }
    });
};
