import { useEffect, useState } from 'react'
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
import { ProjectService } from '@/services/projectService'
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
} from '@/types/database'

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

// Map is_completed to status
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

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  // Fetch tasks from Supabase
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await ProjectService.getTasks(projectId)

        // ProjectService.getTasks returns { data, error } or just data depending on implementation
        // My implementation in projectService.ts returns Supabase builder which is then awaited.
        // It returns { data, error }.
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeTask = tasks.find((t) => t.id === active.id)
    const overStatus = over.id as string

    if (activeTask && STATUSES.includes(overStatus as TaskStatus)) {
      setTasks((tasks) =>
        tasks.map((task) =>
          task.id === activeTask.id
            ? { ...task, status: overStatus as TaskStatus }
            : task,
        ),
      )
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeTask = tasks.find((t) => t.id === active.id)
    const newStatus = over.id as string

    if (
      activeTask &&
      STATUSES.includes(newStatus as TaskStatus) &&
      activeTask.status !== newStatus
    ) {
      const originalStatus = activeTask.status

      // 1. Optimistic Update (Immediate Feedback)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTask.id
            ? { ...t, status: newStatus as TaskStatus }
            : t,
        ),
      )

      // 2. Persist via ProjectService
      const success = await ProjectService.updateTaskStatus(
        activeTask.id,
        newStatus,
      )

      // 3. Rollback on Failure
      if (!success) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeTask.id ? { ...t, status: originalStatus } : t,
          ),
        )
        toast({
          title: 'Erro',
          description: 'Falha ao mover a tarefa. Sincronizando...',
          variant: 'destructive',
        })
      }
    }
  }

  const handleTaskSaved = (savedTask: Task) => {
    // Determine if it was an edit or create based on presence in state, or use `editingTask` ref
    // But safely: check if ID exists
    const exists = tasks.some((t) => t.id === savedTask.id)
    const kanbanTask = mapTaskToKanban(savedTask as Tables<'tasks'>) // Cast safe as Task matches Table

    if (exists) {
      setTasks((prev) =>
        prev.map((t) => (t.id === savedTask.id ? kanbanTask : t)),
      )
    } else {
      setTasks((prev) => [kanbanTask, ...prev])
    }

    setEditingTask(null)
    setIsDialogOpen(false)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task as KanbanTask) // KanbanTask extends Task
    setIsDialogOpen(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    // 1. Optimistic Delete
    const originalTasks = [...tasks]
    setTasks((prev) => prev.filter((t) => t.id !== taskId))

    // 2. Persist
    const success = await ProjectService.deleteTask(taskId)

    // 3. Rollback
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
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full" />
      </div>
    )
  }

  const tasksByStatus = STATUSES.map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status),
  }))

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Tarefas do Projeto
        </h3>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          {/* Plus icon included in button or text */}
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

      {/* Kanban Board */}
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
              onNewTask={() => setIsDialogOpen(true)}
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
