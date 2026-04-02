import { supabase } from '@/integrations/supabase/client'

export const fetchAssistants = async () => {
  const { data, error } = await supabase
    .from('assistants')
    .select('*')
    .order('status', { ascending: false })
  return { data, error }
}
