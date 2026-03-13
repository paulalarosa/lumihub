import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { TaskCard } from './TaskCard'
import type { KanbanTask } from '@/types/database'

interface KanbanColumnProps {
  status: string
  statusLabel: string
  tasks: KanbanTask[]
  priorityColors: Record<string, string>
  priorityLabels: Record<string, string>
  isFirstColumn: boolean
  onNewTask: () => void
  activeTaskId: string | null
  onEdit: (task: KanbanTask) => void
  onDelete: (taskId: string) => void
}

export const KanbanColumn = memo(
  ({
    status,
    statusLabel,
    tasks,
    priorityColors,
    priorityLabels,
    isFirstColumn,
    onNewTask,
    activeTaskId,
    onEdit,
    onDelete,
  }: KanbanColumnProps) => {
    const { setNodeRef } = useDroppable({
      id: status,
    })

    return (
      <div
        ref={setNodeRef}
        className="bg-gray-50 rounded-lg p-4 min-h-96 flex flex-col border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Column Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{statusLabel}</h3>
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold bg-gray-200 text-gray-700 rounded-full">
              {tasks.length}
            </span>
          </div>
        </div>

        {/* Tasks Container */}
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <div className="text-sm">Sem tarefas</div>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  priorityColor={priorityColors[task.priority]}
                  priorityLabel={priorityLabels[task.priority]}
                  isActive={activeTaskId === task.id}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </SortableContext>

        {/* Add Task Button - Only in first column */}
        {isFirstColumn && (
          <button
            onClick={onNewTask}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all group"
          >
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Nova Tarefa</span>
          </button>
        )}
      </div>
    )
  },
)

KanbanColumn.displayName = 'KanbanColumn'
