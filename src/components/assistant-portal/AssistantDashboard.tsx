import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, CheckSquare, Clock, MapPin, Users, DollarSign, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FeatureLockedCard from "./FeatureLockedCard";

interface Event {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  location: string | null;
  event_type: string | null;
  clients?: { name: string } | null;
}

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  is_completed: boolean;
  projects?: { name: string } | null;
}

interface AssistantDashboardProps {
  events: Event[];
  tasks: Task[];
  onLockedClick: (feature: string) => void;
}

const AssistantDashboard = ({ events, tasks, onLockedClick }: AssistantDashboardProps) => {
  const today = new Date();
  
  const upcomingEvents = events
    .filter((e) => {
      const eventDate = parseISO(e.event_date);
      return isToday(eventDate) || isTomorrow(eventDate);
    })
    .slice(0, 3);

  const pendingTasks = tasks.filter((t) => !t.is_completed).slice(0, 5);
  const monthEvents = events.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Bem-vinda ao seu portal de assistente
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos do Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthEvents}</div>
            <p className="text-xs text-muted-foreground">
              eventos atribuídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              para completar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              hoje e amanhã
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
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
                  const eventDate = parseISO(event.event_date);
                  return (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="text-center min-w-[50px]">
                        <div className="text-xs uppercase text-muted-foreground">
                          {isToday(eventDate) ? "Hoje" : "Amanhã"}
                        </div>
                        <div className="text-lg font-bold">
                          {format(eventDate, "dd")}
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
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
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
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
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
                        {format(parseISO(task.due_date), "dd/MM")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Locked Features */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recursos Premium</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureLockedCard
            title="Clientes"
            description="Acesse informações completas dos clientes atribuídos"
            icon={<Users className="h-8 w-8" />}
            onUnlock={() => onLockedClick("Clientes")}
          />
          <FeatureLockedCard
            title="Financeiro"
            description="Visualize valores e sua comissão por evento"
            icon={<DollarSign className="h-8 w-8" />}
            onUnlock={() => onLockedClick("Financeiro")}
          />
          <FeatureLockedCard
            title="Relatórios"
            description="Acompanhe sua performance e estatísticas"
            icon={<BarChart3 className="h-8 w-8" />}
            onUnlock={() => onLockedClick("Relatórios")}
          />
        </div>
      </div>
    </div>
  );
};

export default AssistantDashboard;
