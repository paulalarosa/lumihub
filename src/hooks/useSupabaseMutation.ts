import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'

type TableName = keyof Database['public']['Tables']
type Operation = 'insert' | 'update' | 'upsert' | 'delete'

interface SupabaseMutationParams<T extends TableName> {
  table: T
  operation: Operation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: Omit<UseMutationOptions<any, Error, any, unknown>, 'mutationFn'>
}

/**
 * Universal wrapper for Supabase PostgREST mutations.
 * Centralizes duplicate data-fetching chains into a single TanStack hook.
 *
 * @example
 * const { mutate: createClient } = useSupabaseMutation({
 *    table: 'wedding_clients',
 *    operation: 'insert'
 * });
 *
 * createClient({ name: 'John Doe', status: 'lead' });
 */
export function useSupabaseMutation<T extends TableName>({
  table,
  operation,
  options,
}: SupabaseMutationParams<T>) {
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (payload: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = (supabase.from(table as any) as any)[operation](payload)

      // PostgREST "delete" operations do not typically return data without an explicit select and eq chain,
      // handled uniquely per component. This abstracts insert/update/upserts.
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
