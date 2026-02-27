import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

type Operation = 'insert' | 'update' | 'delete' | 'upsert'

interface MutationOptions {
  table: string
  operation: Operation
  invalidateKeys?: string[][]
  successMessage?: string
  errorMessage?: string
  onSuccess?: () => void
}

export function useSupabaseMutation<T extends Record<string, unknown>>({
  table,
  operation,
  invalidateKeys,
  successMessage,
  errorMessage,
  onSuccess: onSuccessCallback,
}: MutationOptions) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const operationLabels: Record<Operation, string> = {
    insert: 'Criado',
    update: 'Atualizado',
    delete: 'Removido',
    upsert: 'Salvo',
  }

  return useMutation({
    mutationFn: async (data: T & { id?: string }) => {
      const query = (supabase as any).from(table)

      switch (operation) {
        case 'insert': {
          const { error } = await (query as any).insert(data)
          if (error) throw error
          break
        }
        case 'update': {
          if (!data.id) throw new Error('ID obrigatório para update')
          const { id, ...rest } = data
          const { error } = await (query as any).update(rest).eq('id', id)
          if (error) throw error
          break
        }
        case 'delete': {
          if (!data.id) throw new Error('ID obrigatório para delete')
          const { error } = await (query as any).delete().eq('id', data.id)
          if (error) throw error
          break
        }
        case 'upsert': {
          const { error } = await (query as any).upsert(data)
          if (error) throw error
          break
        }
      }
    },
    onSuccess: () => {
      const keysToInvalidate = invalidateKeys || [[table]]
      keysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })

      toast({
        title: successMessage || `${operationLabels[operation]} com sucesso!`,
      })

      onSuccessCallback?.()
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
