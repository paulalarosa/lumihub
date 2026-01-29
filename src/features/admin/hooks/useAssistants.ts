import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAssistants = () => {
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
