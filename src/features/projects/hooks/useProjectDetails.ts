import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { ProjectService as ProjectServiceClass } from '../api/projectService'

import { supabase } from '@/integrations/supabase/client'
import type {
  ProjectDetailsResponse,
  ProjectWithRelations,
  BriefingUI,
  BriefingContent,
  ServiceUI,
} from '@/types/api.types'
import type { Database } from '@/integrations/supabase/types'

type LocalProjectWithRelations =
  Database['public']['Tables']['projects']['Row'] & {
    client: Database['public']['Tables']['wedding_clients']['Row'] | null
  }

export const useProjectDetails = (projectId: string | undefined) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!projectId) return

    const channel = supabase
      .channel(`project-details-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project', projectId] })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contracts',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project', projectId] })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project', projectId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, queryClient])

  return useQuery<ProjectDetailsResponse>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required')

      const [
        projectRes,
        tasksRes,
        briefingRes,
        servicesRes,
        linkedServicesRes,
        transactionsRes,
      ] = await Promise.all([
        ProjectServiceClass.get(projectId),
        ProjectServiceClass.getTasks(projectId),
        ProjectServiceClass.getBriefing(projectId),
        supabase.from('services').select('*'),
        ProjectServiceClass.getProjectServices(projectId),
        supabase.from('transactions').select('*').eq('project_id', projectId),
      ])

      if (projectRes.error) throw projectRes.error

      const project = projectRes.data as LocalProjectWithRelations

      const adaptedProject: Record<string, any> = { ...project }
      if (adaptedProject.client) {
        adaptedProject.clients = {
          ...adaptedProject.client,
          name: adaptedProject.client.full_name || adaptedProject.client.name,
        }
      }

      const { data: contractsData } = await supabase
        .from('contracts')
        .select('*')
        .or(
          `project_id.eq.${projectId},client_id.eq.${project?.client_id || project?.client?.id}`,
        )

      let briefing = null
      if (briefingRes.data) {
        const content = briefingRes.data.content as BriefingContent
        briefing = {
          ...briefingRes.data,
          questions: content?.questions || [],
          answers: content?.answers || {},
          is_submitted: briefingRes.data.status === 'submitted',
        } as BriefingUI
      }

      const services = (servicesRes.data || []).map((s) => ({
        ...s,
        price: Number(s.price),
        duration_minutes: Number(s.duration_minutes || 0),
        base_price: s.base_price || 0,
      }))

      const projectServices = (linkedServicesRes.data || []).map((s) => ({
        ...s,
        quantity: Number(s.quantity),
        unit_price: Number(s.unit_price),
        total_price: Number(s.total_price),
        service: s.service
          ? {
              ...s.service,
              price: Number(s.service.price),
              base_price: Number(s.service.price),
              duration_minutes: Number(s.service.duration_minutes || 0),
            }
          : undefined,
      }))

      const response: ProjectDetailsResponse = {
        project: adaptedProject as ProjectWithRelations,
        tasks: tasksRes.data || [],
        briefing,
        contracts: contractsData || [],
        services: services as ServiceUI[],
        projectServices: projectServices,
        transactions: transactionsRes.data || [],
        invoices: [],
      }

      return response
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  })
}
