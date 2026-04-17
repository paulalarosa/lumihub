import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { ProjectService } from '../api/projectService'
import { useOrganization } from '@/hooks/useOrganization'

import { useToast } from '@/hooks/use-toast'
import type { Task, TaskPriority } from '@/types'
import { logger } from '@/services/logger'

interface TaskDialogProps {
  projectId: string
  taskToEdit?: Task | null
  onTaskSaved: (task: Task) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDialog({
  projectId,
  taskToEdit,
  onTaskSaved,
  isOpen,
  onOpenChange,
}: TaskDialogProps) {
  const { toast } = useToast()
  const { organizationId } = useOrganization()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title)
      setPriority((taskToEdit.priority as TaskPriority) || 'medium')
    } else {
      setTitle('')
      setPriority('medium')
    }
  }, [taskToEdit, isOpen])

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha o título da tarefa.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      if (taskToEdit) {
        const success = await ProjectService.updateTask(taskToEdit.id, {
          title: title.trim(),
          priority,
        })

        if (!success) throw new Error('Falha ao atualizar tarefa')

        toast({ title: 'Sucesso', description: 'Tarefa atualizada.' })
        onTaskSaved({ ...taskToEdit, title: title.trim(), priority })
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Usuário não autenticado')

        const { data, error } = await ProjectService.createTask({
          project_id: projectId,
          title: title.trim(),
          description: '',
          user_id: organizationId || user.id,
          priority: priority,
          status: 'todo',
        })

        if (error) throw error

        toast({ title: 'Sucesso', description: 'Tarefa criada.' })

        onTaskSaved(data)
      }

      onOpenChange(false)
      if (!taskToEdit) {
        setTitle('')
        setPriority('medium')
      }
    } catch (error) {
      logger.error(error, 'TaskDialog.handleSave', { showToast: false })
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a tarefa.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  const isEditing = !!taskToEdit

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {!isEditing && (
        <DialogTrigger asChild>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Tarefa' : 'Criar Nova Tarefa'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Faça alterações na tarefa selecionada.'
              : 'Adicione uma nova tarefa ao projeto.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Título
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Implementar login com Google"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {}
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Prioridade
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>
        </div>

        {}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !title.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Salving...
              </>
            ) : isEditing ? (
              'Salvar Alterações'
            ) : (
              'Criar Tarefa'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
