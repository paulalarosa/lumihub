import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

import { Plus, Trash2 } from 'lucide-react'

interface Task {
  id: string
  title: string
  status: string | null
  sort_order: number | null
}

interface ProjectTasksProps {
  tasks: Task[]
  newTaskTitle: string
  setNewTaskTitle: (val: string) => void
  addTask: (e?: React.FormEvent) => void
  toggleTask: (taskId: string, currentStatus: string | null) => void
  deleteTask: (taskId: string) => void
  t: (key: string) => string
}

export const ProjectTasks = ({
  tasks,
  newTaskTitle,
  setNewTaskTitle,
  addTask,
  toggleTask,
  deleteTask,
  t,
}: ProjectTasksProps) => {
  return (
    <Card className="bg-black border border-white/20 rounded-none">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-white font-serif uppercase tracking-wide">
          {t('dashboard.task_manager')}
        </CardTitle>
        <CardDescription className="text-white/40 font-mono text-xs uppercase tracking-widest">
          OPERATIONAL_CHECKLIST
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="INPUT_NEW_TASK..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask(e)}
            className="flex-1 bg-black border-white/20 rounded-none text-white font-mono uppercase focus:border-white placeholder:text-white/30"
          />
          <Button
            onClick={addTask}
            className="bg-white text-black hover:bg-white/80 rounded-none aspect-square p-0 w-10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-white/20 text-center py-8 font-mono uppercase text-xs tracking-widest border border-white/10 border-dashed">
              NO_TASKS_PENDING
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={() => toggleTask(task.id, task.status)}
                    className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black rounded-none"
                  />
                  <span
                    className={`font-mono text-sm uppercase ${task.status === 'completed' ? 'line-through text-white/30' : 'text-white'}`}
                  >
                    {task.title}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTask(task.id)}
                  className="text-white/30 hover:text-white hover:bg-transparent rounded-none"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
