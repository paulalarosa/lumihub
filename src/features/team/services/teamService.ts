
import { supabase } from '@/integrations/supabase/client';

export const fetchAssistants = async () => {
    const { data, error } = await supabase
        .from('assistants') // Queries the new SQL View
        .select('*')
        .order('status', { ascending: false }); // Show pending invites first
    return { data, error };
};
