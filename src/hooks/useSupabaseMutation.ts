import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'

type TableName = keyof Database['public']['Tables']
type Operation = 'insert' | 'update' | 'upsert' | 'delete'

interface SupabaseMutationParams<T extends TableName> {
  table: T
  operation: Operation

  options?: Omit<UseMutationOptions<any, Error, any, unknown>, 'mutationFn'>
}

export function useSupabaseMutation<T extends TableName>({
  table,
  operation,
  options,
}: SupabaseMutationParams<T>) {
  return useMutation({
    mutationFn: async (payload: any) => {
      const query = supabase.from(table)[operation](payload)

      if (operation !== 'delete') {
        const { data, error } = await query.select().single()
        if (error) throw error
        return data
      } else {
        const { data, error } = await query
        if (error) throw error
        return data
      }
    },
    ...options,
  })
}
