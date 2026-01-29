import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSystemLogs = () => {
    return useQuery({
        queryKey: ['system-logs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('analytics_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data;
        }
    });
};
