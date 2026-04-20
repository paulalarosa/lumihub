import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { logger } from '@/services/logger'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'

export interface WorkflowAction {
  type: 'send_email' | 'create_task' | 'notify' | 'delay'
  [key: string]: unknown
}

export interface Workflow {
  id: string
  user_id: string
  name: string
  description: string | null
  trigger_type: string
  trigger_config: Record<string, unknown>
  actions: WorkflowAction[]
  is_active: boolean
  last_run_at: string | null
  run_count: number
  created_at: string
  updated_at: string
}

export function useWorkflows() {
  const { user } = useAuth()
  const qc = useQueryClient()

  useRealtimeInvalidate({
    table: ['workflows', 'workflow_executions'],
    invalidate: ['workflows'],
    filter: user ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user,
    channelName: 'rt-workflows',
  })

  const list = useQuery({
    queryKey: ['workflows', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Workflow[]
    },
    enabled: !!user,
  })

  const create = useMutation({
    mutationFn: async (input: {
      name: string
      description?: string
      trigger_type: string
      actions: WorkflowAction[]
    }) => {
      const { data, error } = await supabase
        .from('workflows')
        .insert({ ...input, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data as Workflow
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Workflow criado')
    },
    onError: (err) => {
      logger.error(err, 'useWorkflows.create')
      toast.error('Erro ao criar workflow')
    },
  })

  const update = useMutation({
    mutationFn: async (input: { id: string; patch: Partial<Workflow> }) => {
      const { data, error } = await supabase
        .from('workflows')
        .update(input.patch)
        .eq('id', input.id)
        .select()
        .single()
      if (error) throw error
      return data as Workflow
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Workflow atualizado')
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workflows').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Workflow removido')
    },
  })

  const toggle = async (w: Workflow) => {
    await update.mutateAsync({
      id: w.id,
      patch: { is_active: !w.is_active },
    })
  }

  return { list, create, update, remove, toggle }
}
