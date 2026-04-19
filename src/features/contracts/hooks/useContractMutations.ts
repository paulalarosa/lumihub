import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'
import { sanitizeFormData } from '@/lib/security'

export function useContractMutations() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const createMutation = useMutation({
    mutationFn: async (
      contractData: Database['public']['Tables']['contracts']['Insert'],
    ) => {
      const cleanData = sanitizeFormData(
        contractData as Record<string, unknown>,
      ) as Database['public']['Tables']['contracts']['Insert']
      const { data, error } = await supabase
        .from('contracts')
        .insert(cleanData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      if (variables.project_id) {
        queryClient.invalidateQueries({
          queryKey: ['project', variables.project_id],
        })
      }
      toast({ title: 'Contrato criado com sucesso!' })
    },
    onError: (error) => {
      logger.error(error, 'useContractMutations.create')
      toast({
        title: 'Erro ao criar contrato',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Database['public']['Tables']['contracts']['Update']
    }) => {
      const cleanData = sanitizeFormData(
        data as Record<string, unknown>,
      ) as Database['public']['Tables']['contracts']['Update']
      const { data: result, error } = await supabase
        .from('contracts')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contract', data.id] })
      if (data.project_id) {
        queryClient.invalidateQueries({
          queryKey: ['project', data.project_id],
        })
      }
      toast({ title: 'Contrato atualizado!' })
    },
    onError: (error) => {
      logger.error(error, 'useContractMutations.update')
      toast({
        title: 'Erro ao atualizar contrato',
        variant: 'destructive',
      })
    },
  })

  const signMutation = useMutation({
    mutationFn: async ({
      id,
      signature_url,
      project_id,
    }: {
      id: string
      signature_url: string
      project_id?: string
    }) => {
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'signed',
          signature_url,
          signed_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
      return { id, project_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contract', data.id] })
      if (data.project_id) {
        queryClient.invalidateQueries({
          queryKey: ['project', data.project_id],
        })
      }
      toast({ title: 'Contrato assinado com sucesso!' })
    },
    onError: (error) => {
      logger.error(error, 'useContractMutations.sign')
      toast({
        title: 'Erro ao assinar contrato',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async ({
      id,
      project_id,
    }: {
      id: string
      project_id?: string
    }) => {
      const { error } = await supabase.from('contracts').delete().eq('id', id)

      if (error) throw error
      return { id, project_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      if (data.project_id) {
        queryClient.invalidateQueries({
          queryKey: ['project', data.project_id],
        })
      }
      toast({ title: 'Contrato excluído!' })
    },
    onError: (error) => {
      logger.error(error, 'useContractMutations.delete')
      toast({
        title: 'Erro ao excluir contrato',
        variant: 'destructive',
      })
    },
  })

  return {
    createMutation,
    updateMutation,
    signMutation,
    deleteMutation,
  }
}
