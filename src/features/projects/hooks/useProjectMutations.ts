import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'
import { ProjectService } from '../api/projectService'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'
import { sanitizeFormData } from '@/lib/security'
import { analyticsService } from '@/services/analytics.service'

export function useProjectMutations() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const createProjectMutation = useMutation({
    mutationFn: async (
      projectData: Database['public']['Tables']['projects']['Insert'],
    ) => {
      const cleanData = sanitizeFormData(
        projectData as Record<string, unknown>,
      ) as Database['public']['Tables']['projects']['Insert']
      const { data, error } = await supabase
        .from('projects')
        .insert(cleanData)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      analyticsService.trackEvent({
        action: 'project_created',
        category: 'feature_usage',
        value: data?.total_value ?? undefined,
      })
      toast({ title: 'Projeto criado!' })
    },
    onError: (error) => {
      logger.error(error, 'useProjectMutations.createProject')
      toast({ title: 'Erro ao criar projeto', variant: 'destructive' })
    },
  })

  const updateProjectMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Database['public']['Tables']['projects']['Update']
    }) => {
      const cleanData = sanitizeFormData(
        data as Record<string, unknown>,
      ) as Database['public']['Tables']['projects']['Update']
      const { data: result, error } = await supabase
        .from('projects')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      toast({ title: 'Projeto atualizado!' })
    },
    onError: (error) => {
      logger.error(error, 'useProjectMutations.updateProject')
      toast({ title: 'Erro ao atualizar projeto', variant: 'destructive' })
    },
  })

  const createTaskMutation = useMutation({
    mutationFn: async (
      taskData: Database['public']['Tables']['tasks']['Insert'],
    ) => {
      const { data, error } = await ProjectService.createTask(taskData)
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['project', variables.project_id, 'tasks'],
      })
      queryClient.invalidateQueries({
        queryKey: ['project', variables.project_id],
      })
    },
    onError: (error) => {
      logger.error(error, 'useProjectMutations.createTask')
      toast({ title: 'Erro ao criar tarefa', variant: 'destructive' })
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      project_id,
    }: {
      id: string
      data: Database['public']['Tables']['tasks']['Update']
      project_id: string
    }) => {
      const success = await ProjectService.updateTask(id, data)
      if (!success) throw new Error('Falha ao atualizar tarefa')
      return { id, project_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['project', data.project_id, 'tasks'],
      })
    },
    onError: (error) => {
      logger.error(error, 'useProjectMutations.updateTask')
      toast({ title: 'Não conseguimos salvar a tarefa', variant: 'destructive' })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async ({
      id,
      project_id,
    }: {
      id: string
      project_id: string
    }) => {
      const success = await ProjectService.deleteTask(id)
      if (!success) throw new Error('Falha ao deletar tarefa')
      return { id, project_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['project', data.project_id, 'tasks'],
      })
    },
    onError: (error) => {
      logger.error(error, 'useProjectMutations.deleteTask')
      toast({ title: 'Não conseguimos excluir a tarefa', variant: 'destructive' })
    },
  })

  const addServiceMutation = useMutation({
    mutationFn: async (
      serviceData: Database['public']['Tables']['project_services']['Insert'],
    ) => {
      const { data: _data, error } =
        await ProjectService.addProjectService(serviceData)
      if (error) throw error
      return serviceData
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project', data.project_id] })
      queryClient.invalidateQueries({
        queryKey: ['project', data.project_id, 'services'],
      })
      toast({ title: 'Serviço adicionado!' })
    },
    onError: (error) => {
      logger.error(error, 'useProjectMutations.addService')
      toast({ title: 'Erro ao adicionar serviço', variant: 'destructive' })
    },
  })

  const removeServiceMutation = useMutation({
    mutationFn: async ({
      id,
      project_id,
    }: {
      id: string
      project_id: string
    }) => {
      const { error } = await ProjectService.deleteProjectService(id)
      if (error) throw error
      return { project_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project', data.project_id] })
      queryClient.invalidateQueries({
        queryKey: ['project', data.project_id, 'services'],
      })
      toast({ title: 'Serviço removido!' })
    },
    onError: (error) => {
      logger.error(error, 'useProjectMutations.removeService')
      toast({ title: 'Não conseguimos remover o serviço', variant: 'destructive' })
    },
  })

  const registerPaymentMutation = useMutation({
    mutationFn: async (
      paymentData: Database['public']['Tables']['transactions']['Insert'],
    ) => {
      const cleanData = sanitizeFormData(
        paymentData as Record<string, unknown>,
      ) as Database['public']['Tables']['transactions']['Insert']
      const { error } = await supabase.from('transactions').insert([cleanData])
      if (error) throw error
      return paymentData
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project', data.project_id] })
      queryClient.invalidateQueries({
        queryKey: ['project', data.project_id, 'payments'],
      })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      toast({ title: 'Pagamento registrado!' })
    },
    onError: (error) => {
      logger.error(error, 'useProjectMutations.registerPayment')
      toast({ title: 'Erro ao registrar pagamento', variant: 'destructive' })
    },
  })

  return {
    createProjectMutation,
    updateProjectMutation,
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    addServiceMutation,
    removeServiceMutation,
    registerPaymentMutation,
  }
}
