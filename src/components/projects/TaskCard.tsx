import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Task } from '@/types/database';

interface TaskCardProps {
  task: Task;
  priorityColor: string;
  priorityLabel: string;
  isActive: boolean;
}

export function TaskCard({
  task,
  priorityColor,
  priorityLabel,
  isActive,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all ${
        isDragging
          ? 'shadow-lg ring-2 ring-blue-400'
          : 'shadow-sm hover:shadow-md border-gray-200'
      } ${isActive ? 'ring-2 ring-blue-300' : ''}`}
    >
      <div className="flex gap-2">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-start pt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
            {task.title}
          </h4>

          {/* Priority Badge */}
          <div className="flex items-start">
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-semibold ${priorityColor}`}
            >
              {priorityLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
