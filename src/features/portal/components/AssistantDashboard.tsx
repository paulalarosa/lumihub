import { format } from 'date-fns/format'
import { isToday } from 'date-fns/isToday'
import { parseISO } from 'date-fns/parseISO'

import {
  Calendar,
  CheckSquare,
  Clock,
  MapPin,
  Users,
  DollarSign,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import FeatureLockedCard from './FeatureLockedCard'
import { motion } from 'framer-motion'
import {
  useAssistantDashboard,
  Event,
  Task,
} from '../hooks/useAssistantDashboard'

interface AssistantDashboardProps {
  events: Event[]
  tasks: Task[]
  onLockedClick: (feature: string) => void
  assistantId?: string
}

const AssistantDashboard = ({
  events,
  tasks,
  onLockedClick,
  assistantId,
}: AssistantDashboardProps) => {
  const {
    upcomingEvents,
    pendingTasks,
    monthEvents,
    earningsData,
    progressToTarget,
    progressToMilestone,
    missingToMilestone,
    monthGrowth,
  } = useAssistantDashboard(events, tasks, assistantId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Bem-vinda ao seu portal de assistente
        </p>
      </div>

      {}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eventos do Mês
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthEvents}</div>
            <p className="text-xs text-muted-foreground">eventos atribuídos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tarefas Pendentes
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground">para completar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximos Eventos
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">hoje e amanhã</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <DollarSign className="h-5 w-5" />
                Meus Ganhos
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary"
                >
                  Privado
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    R${' '}
                    {earningsData.thisMonth.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-sm text-muted-foreground">Este mês</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    +{monthGrowth.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    vs mês passado
                  </div>
                </div>
              </div>

              {}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Meta do mês</span>
                  <span className="font-medium">
                    {progressToTarget.toFixed(0)}% • R${' '}
                    {earningsData.targetThisMonth.toLocaleString('pt-BR')}
                  </span>
                </div>
                <Progress value={progressToTarget} className="h-3" />
              </div>

              {}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Próximo marco</span>
                  <span className="font-medium">
                    R$ {earningsData.nextMilestone.toLocaleString('pt-BR')}
                  </span>
                </div>
                <Progress value={progressToMilestone} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  Faltam R$ {missingToMilestone.toLocaleString('pt-BR')}
                </div>
              </div>

              {}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">
                    {earningsData.eventsCompleted}
                  </div>
                  <div className="text-xs text-muted-foreground">Eventos</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">
                    {earningsData.commissionRate}%
                  </div>
                  <div className="text-xs text-muted-foreground">Comissão</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">
                    R$ {earningsData.totalEarned.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum evento para hoje ou amanhã
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => {
                  const eventDate = parseISO(event.event_date)
                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="text-center min-w-[50px]">
                        <div className="text-xs uppercase text-muted-foreground">
                          {isToday(eventDate) ? 'Hoje' : 'Amanhã'}
                        </div>
                        <div className="text-lg font-bold">
                          {format(eventDate, 'dd')}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        {event.clients?.name && (
                          <p className="text-sm text-muted-foreground truncate">
                            {event.clients.name}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {event.start_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.start_time}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {event.event_type && (
                        <Badge variant="secondary" className="shrink-0">
                          {event.event_type}
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Tarefas Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma tarefa pendente
            </p>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    {task.projects?.name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {task.projects.name}
                      </p>
                    )}
                  </div>
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(parseISO(task.due_date), 'dd/MM')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recursos Premium</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureLockedCard
            title="Clientes"
            description="Acesse informações completas dos clientes atribuídos"
            icon={<Users className="h-8 w-8" />}
            onUnlock={() => onLockedClick('Clientes')}
          />
          <FeatureLockedCard
            title="Financeiro"
            description="Visualize valores e sua comissão por evento"
            icon={<DollarSign className="h-8 w-8" />}
            onUnlock={() => onLockedClick('Financeiro')}
          />
          <FeatureLockedCard
            title="Relatórios"
            description="Acompanhe sua performance e estatísticas"
            icon={<BarChart3 className="h-8 w-8" />}
            onUnlock={() => onLockedClick('Relatórios')}
          />
        </div>
      </div>
    </div>
  )
}
export default AssistantDashboard
