import { useEffect, useState, useCallback, useMemo } from 'react'
import { logger } from '@/services/logger'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { ProjectService } from '../api/projectService'

import { useToast } from '@/hooks/use-toast'
import { KanbanColumn } from './KanbanColumn'
import { TaskDialog } from './TaskDialog'
import type { Tables } from '@/integrations/supabase/types'
import {
  TaskStatus,
  TaskPriority,
  KanbanTask,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  Task,
} from '@/types'

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

function mapTaskToKanban(task: Tables<'tasks'>): KanbanTask {
  return {
    ...task,
    status: (task.status as TaskStatus) || 'todo',
    priority: (task.priority as TaskPriority) || 'medium',
  }
}

interface ProjectKanbanProps {
  projectId: string
}

export function ProjectKanban({ projectId }: ProjectKanbanProps) {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<KanbanTask[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await ProjectService.getTasks(projectId)
        if (data.error) throw data.error
        setTasks((data.data || []).map(mapTaskToKanban))
      } catch (error) {
        logger.error(error, 'ProjectKanban.fetchTasks', { showToast: false })
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as tarefas.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [projectId, toast])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const overStatus = over.id as string
    if (!STATUSES.includes(overStatus as TaskStatus)) return

    setTasks((prevTasks) => {
      const activeTask = prevTasks.find((t) => t.id === active.id)
      if (!activeTask || activeTask.status === overStatus) return prevTasks

      return prevTasks.map((task) =>
        task.id === active.id
          ? { ...task, status: overStatus as TaskStatus }
          : task,
      )
    })
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (!over) return

      const newStatus = over.id as string
      if (!STATUSES.includes(newStatus as TaskStatus)) return

      setTasks((prevTasks) => {
        const activeTask = prevTasks.find((t) => t.id === active.id)
        if (!activeTask || activeTask.status === newStatus) return prevTasks

        const originalStatus = activeTask.status

        ProjectService.updateTaskStatus(activeTask.id, newStatus).then(
          (success) => {
            if (!success) {
              setTasks((currentTasks) =>
                currentTasks.map((t) =>
                  t.id === active.id ? { ...t, status: originalStatus } : t,
                ),
              )
              toast({
                title: 'Erro',
                description: 'Falha ao mover a tarefa. Sincronizando...',
                variant: 'destructive',
              })
            }
          },
        )

        return prevTasks.map((t) =>
          t.id === active.id ? { ...t, status: newStatus as TaskStatus } : t,
        )
      })
    },
    [toast],
  )

  const handleTaskSaved = useCallback((savedTask: Task) => {
    const kanbanTask = mapTaskToKanban(savedTask as Tables<'tasks'>)

    setTasks((prev) => {
      const exists = prev.some((t) => t.id === savedTask.id)
      if (exists) {
        return prev.map((t) => (t.id === savedTask.id ? kanbanTask : t))
      }
      return [kanbanTask, ...prev]
    })

    setEditingTask(null)
    setIsDialogOpen(false)
  }, [])

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task as KanbanTask)
    setIsDialogOpen(true)
  }, [])

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      let originalTasks: KanbanTask[] = []

      setTasks((prev) => {
        originalTasks = [...prev]
        return prev.filter((t) => t.id !== taskId)
      })

      const success = await ProjectService.deleteTask(taskId)

      if (!success) {
        setTasks(originalTasks)
        toast({
          title: 'Erro',
          description: 'Falha ao excluir a tarefa.',
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Sucesso', description: 'Tarefa excluída.' })
      }
    },
    [toast],
  )

  const handleNewTask = useCallback(() => {
    setIsDialogOpen(true)
  }, [])

  const tasksByStatus = useMemo(
    () =>
      STATUSES.map((status) => ({
        status,
        tasks: tasks.filter((task) => task.status === status),
      })),
    [tasks],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Tarefas do Projeto
        </h3>
        <button
          onClick={handleNewTask}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          Nova Tarefa
        </button>
      </div>

      <TaskDialog
        projectId={projectId}
        isOpen={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingTask(null)
        }}
        onTaskSaved={handleTaskSaved}
        taskToEdit={editingTask}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tasksByStatus.map(({ status, tasks: statusTasks }) => (
            <KanbanColumn
              key={status}
              status={status}
              statusLabel={TASK_STATUS_LABELS[status]}
              tasks={statusTasks}
              priorityColors={TASK_PRIORITY_COLORS}
              priorityLabels={TASK_PRIORITY_LABELS}
              isFirstColumn={status === 'todo'}
              onNewTask={handleNewTask}
              activeTaskId={activeId}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
