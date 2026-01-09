import { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KanbanColumn } from './KanbanColumn';
import { NewTaskDialog } from './NewTaskDialog';
import { Task, TaskStatus, TaskPriority, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from '@/types/database';
const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

interface ProjectKanbanProps {
  projectId: string;
}

export function ProjectKanban({ projectId }: ProjectKanbanProps) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    })
  );

  // Fetch tasks from Supabase
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setTasks(data || []);
      } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as tarefas.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectId, toast]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overStatus = over.id as string;

    if (activeTask && STATUSES.includes(overStatus as any)) {
      // Update local state for optimistic UI
      setTasks((tasks) =>
        tasks.map((task) =>
          task.id === activeTask.id
            ? { ...task, status: overStatus as Task['status'] }
            : task
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const newStatus = over.id as string;

    if (activeTask && STATUSES.includes(newStatus as any)) {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ status: newStatus })
          .eq('id', activeTask.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Tarefa atualizada com sucesso.',
        });
      } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        // Revert UI on error
        setTasks((tasks) =>
          tasks.map((task) =>
            task.id === activeTask.id
              ? { ...task, status: activeTask.status }
              : task
          )
        );
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar a tarefa.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  const tasksByStatus = STATUSES.map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status),
  }));

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Tarefas do Projeto</h3>
        <NewTaskDialog
          projectId={projectId}
          onTaskCreated={handleTaskCreated}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </div>

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
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
