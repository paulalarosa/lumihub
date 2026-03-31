import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { ProjectService } from '../api/projectService'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'

export function useProjectMutations() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      toast({ title: 'Projeto criado!' })
    },
    onError: (error) => {
      logger.error(error, 'useProjectMutations.createProject')
      toast({ title: 'Erro ao criar projeto', variant: 'destructive' })
    },
  })

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: result, error } = await supabase
        .from('projects')
        .update(data)
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
    mutationFn: async (taskData: any) => {
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
      data: any
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
  })

  const addServiceMutation = useMutation({
    mutationFn: async (serviceData: any) => {
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
  })

  const registerPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const { error } = await supabase
        .from('transactions')
        .insert([paymentData])
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
