import { supabase } from '@/integrations/supabase/client'

export const getClients = async (
  organizationId: string,
  page: number = 1,
  limit: number = 10,
) => {
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('wedding_clients')
    .select('*', { count: 'exact' })
    .eq('user_id', organizationId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return { data, count }
}
