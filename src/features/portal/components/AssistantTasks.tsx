import { useState } from 'react'
import { format, parseISO, isPast, isToday } from 'date-fns'
import {
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  CheckSquare,
  ListTodo,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  is_completed: boolean
  projects?: { name: string } | null
}

interface AssistantTasksProps {
  tasks: Task[]
  onTaskUpdate: () => void
}

type FilterType = 'all' | 'pending' | 'completed'

const AssistantTasks = ({ tasks, onTaskUpdate }: AssistantTasksProps) => {
  const [filter, setFilter] = useState<FilterType>('pending')
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending') return !task.is_completed
    if (filter === 'completed') return task.is_completed
    return true
  })

  const handleToggleComplete = async (task: Task) => {
    setUpdatingTask(task.id)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: !task.is_completed })
        .eq('id', task.id)

      if (error) throw error

      toast({
        title: task.is_completed ? 'TASK_REOPENED' : 'TASK_COMPLETED',
        description: 'STATUS_UPDATED_SUCCESSFULLY',
      })
      onTaskUpdate()
    } catch (_error) {
      toast({
        title: 'ERROR',
        description: 'FAILED_TO_UPDATE_TASK_STATUS',
        variant: 'destructive',
      })
    } finally {
      setUpdatingTask(null)
    }
  }

  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null
    const date = parseISO(dueDate)
    if (isPast(date) && !isToday(date)) return 'overdue'
    if (isToday(date)) return 'today'
    return 'upcoming'
  }

  const pendingCount = tasks.filter((t) => !t.is_completed).length
  const completedCount = tasks.filter((t) => t.is_completed).length

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-xl font-serif text-white uppercase tracking-widest flex items-center gap-2">
          <ListTodo className="h-5 w-5" /> Operations_List
        </h2>
        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono mt-1">
          /// TASK_MANAGEMENT_SYSTEM
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-black border border-white/20 rounded-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-mono text-white">{tasks.length}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono">
                  TOTAL_OBJECTIVES
                </p>
              </div>
              <div className="h-10 w-10 rounded-none border border-white/20 bg-white/5 flex items-center justify-center">
                <Filter className="h-5 w-5 text-white/50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border border-white/20 rounded-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-mono text-white">{pendingCount}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono">
                  PENDING
                </p>
              </div>
              <div className="h-10 w-10 rounded-none border border-white/20 bg-white/5 flex items-center justify-center">
                <Circle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border border-white/20 rounded-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-mono text-white/50">
                  {completedCount}
                </p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
                  COMPLETED
                </p>
              </div>
              <div className="h-10 w-10 rounded-none border border-white/20 bg-white/5 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-white/30" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 bg-black border border-white/20 p-1 w-fit">
        <Button
          variant={filter === 'all' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
          className={`rounded-none font-mono text-xs uppercase tracking-widest h-7 ${filter === 'all' ? 'bg-white text-black hover:bg-white/90' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
        >
          ALL
        </Button>
        <div className="w-[1px] bg-white/10 h-4 self-center mx-1"></div>
        <Button
          variant={filter === 'pending' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('pending')}
          className={`rounded-none font-mono text-xs uppercase tracking-widest h-7 ${filter === 'pending' ? 'bg-white text-black hover:bg-white/90' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
        >
          PENDING
        </Button>
        <div className="w-[1px] bg-white/10 h-4 self-center mx-1"></div>
        <Button
          variant={filter === 'completed' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('completed')}
          className={`rounded-none font-mono text-xs uppercase tracking-widest h-7 ${filter === 'completed' ? 'bg-white text-black hover:bg-white/90' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
        >
          COMPLETED
        </Button>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="border border-white/10 bg-white/5 border-dashed p-12 text-center">
          <CheckSquare className="h-12 w-12 mx-auto text-white/20 mb-4" />
          <p className="text-white/40 font-mono text-xs uppercase tracking-widest">
            {filter === 'pending'
              ? 'NO_PENDING_TASKS'
              : filter === 'completed'
                ? 'NO_COMPLETED_tasks'
                : 'NO_Record_Found'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const dueDateStatus = getDueDateStatus(task.due_date)

            return (
              <Card
                key={task.id}
                className={cn(
                  'bg-black border border-white/20 rounded-none transition-all hover:border-white group',
                  task.is_completed &&
                    'opacity-50 hover:opacity-100 border-white/10 bg-transparent',
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <Checkbox
                        checked={task.is_completed}
                        onCheckedChange={() => handleToggleComplete(task)}
                        disabled={updatingTask === task.id}
                        className="rounded-none border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black h-5 w-5"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <p
                            className={cn(
                              'font-mono text-sm uppercase tracking-wide text-white leading-tight',
                              task.is_completed && 'line-through text-white/50',
                            )}
                          >
                            {task.title}
                          </p>
                          {task.projects?.name && (
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                              PROJECT: {task.projects.name}
                            </p>
                          )}
                          {task.description && (
                            <p className="text-xs text-white/60 mt-2 font-mono border-l-2 border-white/10 pl-2">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {task.due_date && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'shrink-0 rounded-none border-white/20 font-mono text-[9px] uppercase tracking-widest',
                              dueDateStatus === 'overdue'
                                ? 'text-red-400 border-red-900/50 bg-red-900/10'
                                : dueDateStatus === 'today'
                                  ? 'text-white bg-white/20 border-white'
                                  : 'text-white/50',
                            )}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {dueDateStatus === 'overdue'
                              ? 'OVERDUE'
                              : dueDateStatus === 'today'
                                ? 'TODAY'
                                : format(parseISO(task.due_date), 'dd.MM')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AssistantTasks
