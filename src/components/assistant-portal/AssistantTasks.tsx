import { useState } from "react";
import { format, parseISO, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Circle, Clock, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  projects?: { name: string } | null;
}

interface AssistantTasksProps {
  tasks: Task[];
  onTaskUpdate: () => void;
}

type FilterType = "all" | "pending" | "completed";

const AssistantTasks = ({ tasks, onTaskUpdate }: AssistantTasksProps) => {
  const [filter, setFilter] = useState<FilterType>("pending");
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending") return !task.is_completed;
    if (filter === "completed") return task.is_completed;
    return true;
  });

  const handleToggleComplete = async (task: Task) => {
    setUpdatingTask(task.id);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ is_completed: !task.is_completed })
        .eq("id", task.id);

      if (error) throw error;

      toast.success(task.is_completed ? "Tarefa reaberta" : "Tarefa concluída!");
      onTaskUpdate();
    } catch (error) {
      toast.error("Erro ao atualizar tarefa");
    } finally {
      setUpdatingTask(null);
    }
  };

  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = parseISO(dueDate);
    if (isPast(date) && !isToday(date)) return "overdue";
    if (isToday(date)) return "today";
    return "upcoming";
  };

  const pendingCount = tasks.filter((t) => !t.is_completed).length;
  const completedCount = tasks.filter((t) => t.is_completed).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tarefas</h2>
        <p className="text-muted-foreground">
          Gerencie suas tarefas atribuídas
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{tasks.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Filter className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Circle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Concluídas</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Todas
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          Pendentes ({pendingCount})
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
        >
          Concluídas ({completedCount})
        </Button>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filter === "pending"
                ? "Nenhuma tarefa pendente"
                : filter === "completed"
                ? "Nenhuma tarefa concluída"
                : "Nenhuma tarefa encontrada"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const dueDateStatus = getDueDateStatus(task.due_date);

            return (
              <Card
                key={task.id}
                className={cn(
                  "transition-colors",
                  task.is_completed && "opacity-60"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={task.is_completed}
                      onCheckedChange={() => handleToggleComplete(task)}
                      disabled={updatingTask === task.id}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p
                            className={cn(
                              "font-medium",
                              task.is_completed && "line-through text-muted-foreground"
                            )}
                          >
                            {task.title}
                          </p>
                          {task.projects?.name && (
                            <p className="text-sm text-muted-foreground">
                              Projeto: {task.projects.name}
                            </p>
                          )}
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {task.due_date && (
                          <Badge
                            variant={
                              dueDateStatus === "overdue"
                                ? "destructive"
                                : dueDateStatus === "today"
                                ? "default"
                                : "secondary"
                            }
                            className="shrink-0"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {dueDateStatus === "overdue"
                              ? "Atrasada"
                              : dueDateStatus === "today"
                              ? "Hoje"
                              : format(parseISO(task.due_date), "dd/MM")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssistantTasks;
