
import { useQuery } from "@tanstack/react-query";
import { ProjectService } from "@/services/projectService";
import { supabase } from "@/integrations/supabase/client";

export const useProjectDetails = (projectId: string | undefined) => {
    return useQuery({
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
                ProjectService.get(projectId),
                ProjectService.getTasks(projectId),
                ProjectService.getBriefing(projectId),
                supabase.from('services').select('id, name, price'),
                ProjectService.getProjectServices(projectId),
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

            const project = projectRes.data;

            // Adapt Project Client Structure
            const adaptedProject: any = { ...project };
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
                briefing = {
                    ...briefingRes.data,
                    questions: briefingRes.data.questions as any[],
                    answers: briefingRes.data.answers as Record<string, any>
                };
            }

            // Adapting Services
            const services = (servicesRes.data || []).map(s => ({ ...s, price: s.price }));

            return {
                project: adaptedProject,
                tasks: tasksRes.data || [],
                briefing,
                contracts: contractsData || [],
                services,
                projectServices: linkedServicesRes.data || [],
                transactions: transactionsRes.data || []
            };
        },
        enabled: !!projectId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
