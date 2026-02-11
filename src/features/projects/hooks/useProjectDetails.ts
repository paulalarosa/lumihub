
import { useQuery } from "@tanstack/react-query";
import { ProjectService as ProjectServiceClass } from "@/services/projectService";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectDetailsResponse, ProjectWithRelations, BriefingUI, BriefingContent, ServiceUI } from '@/types/api.types';

export const useProjectDetails = (projectId: string | undefined) => {
    return useQuery<ProjectDetailsResponse>({
        queryKey: ['project-details', projectId],
        queryFn: async () => {
            if (!projectId) throw new Error("Project ID is required");

            const [
                projectRes,
                tasksRes,
                briefingRes,
                servicesRes,
                linkedServicesRes,
                transactionsRes
            ] = await Promise.all([
                ProjectServiceClass.get(projectId),
                ProjectServiceClass.getTasks(projectId),
                ProjectServiceClass.getBriefing(projectId),
                supabase.from('services').select('*'),
                ProjectServiceClass.getProjectServices(projectId),
                supabase.from('transactions').select('*').eq('project_id', projectId)
            ]);

            if (projectRes.error) throw projectRes.error;

            // Parallel fetch for Contracts (needs project data first? No, we can query by project_id)
            // The original code queried by OR(project_id, client_id). 
            // We can do that *after* we have the project to get the client_id, 
            // OR we can just fetch by project_id for now if that covers most cases, 
            // BUT to be safe/correct matching original logic, we need client_id.
            // Let's await project first? No, Promise.all is faster.
            // We'll fetch contracts separately or chaining?
            // Let's do a second step for contracts if client_id is needed.

            const project = projectRes.data as unknown as ProjectWithRelations;

            // Adapt Project Client Structure
            const adaptedProject: Record<string, any> = { ...project };
            if (adaptedProject.client) {
                adaptedProject.clients = {
                    ...adaptedProject.client,
                    name: adaptedProject.client.full_name || adaptedProject.client.name
                };
            }

            // Contracts Query
            // Dependent on Project Data for Client ID
            const { data: contractsData } = await supabase
                .from('contracts')
                .select('*')
                .or(`project_id.eq.${projectId},client_id.eq.${project?.client_id || project?.client?.id}`);

            // Adapting Briefing
            let briefing = null;
            if (briefingRes.data) {
                const content = briefingRes.data.content as unknown as BriefingContent;
                briefing = {
                    ...briefingRes.data,
                    questions: content?.questions || [],
                    answers: content?.answers || {},
                    is_submitted: briefingRes.data.status === 'submitted'
                } as BriefingUI;
            }

            // Adapting Services
            const services = (servicesRes.data || []).map(s => ({
                ...s,
                price: Number(s.price),
                duration_minutes: Number(s.duration_minutes || 0),
                base_price: s.base_price || 0
            }));

            const projectServices = (linkedServicesRes.data || []).map(s => ({
                ...s,
                quantity: Number(s.quantity),
                unit_price: Number(s.unit_price),
                total_price: Number(s.total_price),
                service: s.service ? {
                    ...s.service,
                    price: Number(s.service.price),
                    base_price: Number(s.service.price), // Map price to base_price if needed or ensure type match
                    duration_minutes: Number(s.service.duration_minutes || 0)
                } : undefined
            }));

            // Force cast to ProjectDetailsResponse to satisfy TS if structure is correct but inferred types are loose
            const response: ProjectDetailsResponse = {
                project: adaptedProject as ProjectWithRelations,
                tasks: tasksRes.data || [],
                briefing,
                contracts: contractsData || [],
                services: services as ServiceUI[], // Now matches explicit ServiceUI
                projectServices: projectServices, // Now matches ProjectServiceItem
                transactions: transactionsRes.data || [],
                invoices: []
            };

            return response;
        },
        enabled: !!projectId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
