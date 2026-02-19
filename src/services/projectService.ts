import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/types/supabase'
import { logger } from '@/utils/logger'

type _Project = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export const ProjectService = {
  async list(organizationId: string) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(
          `
                    *,
                    client:wedding_clients(*)
                `,
        )
        .eq('user_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      logger.error(error, { message: 'Erro ao carregar lista de projetos.' })
      return []
    }
  },

  async get(id: string) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(
          `
                    *,
                    client:wedding_clients (
                        id,
                        full_name,
                        email,
                        phone,
                        cpf,
                        address
                    ),
                    invoices(*),
                    contracts(*)
                `,
        )
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      logger.error(error, {
        message: 'Erro ao carregar projeto.',
        context: { projectId: id },
        showToast: false,
      })
      return { data: null, error }
    }
  },

  async create(project: ProjectInsert) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      logger.error(error, { message: 'Erro ao criar projeto.' })
      throw error
    }
  },

  async update(id: string, updates: ProjectUpdate) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      logger.error(error, { message: 'Erro ao atualizar projeto.' })
      throw error
    }
  },

  /* [NEW] Metodo solicitado pelo usuário para Kanban de Projetos */
  async updateProjectStatus(id: string, status: string) {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      logger.error(error, {
        message: 'Não foi possível mover o projeto. Sincronizando...',
        context: { projectId: id, targetStatus: status },
      })
      return false
    }
  },

  /* [NEW] Metodo para Kanban de Tarefas (ProjectKanban.tsx) */
  async updateTaskStatus(id: string, status: string) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      logger.error(error, {
        message: 'Não foi possível mover a tarefa. Sincronizando...',
        context: { taskId: id, targetStatus: status },
      })
      return false
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      logger.error(error, { message: 'Erro ao deletar projeto.' })
      throw error
    }
  },

  async count(organizationId: string) {
    const { count } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', organizationId)
    return count || 0
  },

  // --- Sub-resources (Tasks, Briefings, Contracts, Services) ---
  // Mantendo métodos existentes mas adicionando try/catch básico onde crítico

  // Tasks
  async getTasks(projectId: string) {
    return await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order')
  },
  async createTask(task: Database['public']['Tables']['tasks']['Insert']) {
    return await supabase.from('tasks').insert(task).select().single()
  },

  // Refactored Task Methods (Boolean Return)
  async updateTask(
    id: string,
    updates: Database['public']['Tables']['tasks']['Update'],
  ) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
      if (error) throw error
      return true
    } catch (error) {
      logger.error(error, { message: 'Erro ao atualizar tarefa.' })
      return false
    }
  },
  async deleteTask(id: string) {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      return true
    } catch (error) {
      logger.error(error, { message: 'Erro ao deletar tarefa.' })
      return false
    }
  },

  // Project CRUD (Expanded)
  async updateProject(id: string, updates: ProjectUpdate) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      logger.success('Projeto atualizado com sucesso!')
      return data
    } catch (error) {
      logger.error(error, {
        message: 'Erro ao salvar alterações no projeto.',
        context: { projectId: id },
      })
      return null
    }
  },

  async deleteProject(id: string) {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)

      if (error) throw error
      logger.success('Projeto removido.')
      return true
    } catch (error) {
      logger.error(error, {
        message: 'Não foi possível excluir o projeto.',
        context: { projectId: id },
      })
      return false
    }
  },

  // Briefings
  async getBriefing(projectId: string) {
    return await supabase
      .from('briefings')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle()
  },
  async createBriefing(
    briefing: Database['public']['Tables']['briefings']['Insert'],
  ) {
    return await supabase.from('briefings').insert(briefing).select().single()
  },

  // Contracts
  async getContracts(projectId: string) {
    return await supabase
      .from('contracts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
  },
  async createContract(
    contract: Database['public']['Tables']['contracts']['Insert'],
  ) {
    return await supabase.from('contracts').insert(contract).select().single()
  },

  // Services (Catalog)
  async getCatalogServices() {
    return await supabase.from('services').select('*').order('sort_order')
  },

  // Project Services (Financial)
  async getProjectServices(projectId: string) {
    return await supabase
      .from('project_services')
      .select('*, service:services(*)')
      .eq('project_id', projectId)
      .order('created_at')
  },
  async addProjectService(
    data: Database['public']['Tables']['project_services']['Insert'],
  ) {
    return await supabase
      .from('project_services')
      .insert(data)
      .select()
      .single()
  },
  async deleteProjectService(id: string) {
    return await supabase.from('project_services').delete().eq('id', id)
  },
  async updateProjectService(
    id: string,
    updates: Database['public']['Tables']['project_services']['Update'],
  ) {
    return await supabase.from('project_services').update(updates).eq('id', id)
  },
}
