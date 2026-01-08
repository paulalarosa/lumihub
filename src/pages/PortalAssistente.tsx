import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  LogOut,
  User,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  event_date: string;
  event_type: string | null;
  start_time: string | null;
  end_time: string | null;
  arrival_time: string | null;
  making_of_time: string | null;
  ceremony_time: string | null;
  address: string | null;
  location: string | null;
  notes: string | null;
  color: string | null;
  client?: { name: string } | null;
  project?: { name: string } | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  project: { name: string } | null;
}

export default function PortalAssistente() {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assistantInfo, setAssistantInfo] = useState<{ name: string; id: string } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAssistantInfo();
    }
  }, [user]);

  useEffect(() => {
    if (assistantInfo) {
      fetchEvents();
      fetchTasks();
    }
  }, [assistantInfo, currentMonth]);

  const fetchAssistantInfo = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('assistants')
      .select('id, name')
      .eq('assistant_user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setAssistantInfo(data);
    } else {
      // User is not registered as an assistant
      setLoadingData(false);
    }
  };

  const fetchEvents = async () => {
    if (!assistantInfo) return;
    setLoadingData(true);

    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    // First get event IDs assigned to this assistant
    const { data: assignedEvents, error: assignError } = await supabase
      .from('event_assistants')
      .select('event_id')
      .eq('assistant_id', assistantInfo.id);

    if (assignError) {
      console.error('Error fetching assigned events:', assignError);
      setLoadingData(false);
      return;
    }

    if (!assignedEvents || assignedEvents.length === 0) {
      setEvents([]);
      setLoadingData(false);
      return;
    }

    const eventIds = assignedEvents.map(e => e.event_id);

    // Then fetch the event details
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        client:clients(name),
        project:projects(name)
      `)
      .in('id', eventIds)
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
    setLoadingData(false);
  };

  const fetchTasks = async () => {
    if (!assistantInfo) return;

    // Get projects from assigned events
    const { data: assignedEvents } = await supabase
      .from('event_assistants')
      .select('event_id')
      .eq('assistant_id', assistantInfo.id);

    if (!assignedEvents || assignedEvents.length === 0) {
      setTasks([]);
      return;
    }

    const eventIds = assignedEvents.map(e => e.event_id);

    // Get project IDs from these events
    const { data: eventsWithProjects } = await supabase
      .from('events')
      .select('project_id')
      .in('id', eventIds)
      .not('project_id', 'is', null);

    if (!eventsWithProjects || eventsWithProjects.length === 0) {
      setTasks([]);
      return;
    }

    const projectIds = [...new Set(eventsWithProjects.map(e => e.project_id).filter(Boolean))];

    // Get tasks for these projects that are visible to assistants
    const { data, error } = await supabase
      .from('tasks')
      .select('*, project:projects(name)')
      .in('project_id', projectIds)
      .in('visibility', ['assistant', 'client']) // Tasks visible to assistants
      .order('due_date', { ascending: true, nullsFirst: false });

    if (!error && data) {
      setTasks(data);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const eventsOnDate = selectedDate
    ? events.filter(event => isSameDay(parseISO(event.event_date), selectedDate))
    : [];

  const eventDates = events.map(e => parseISO(e.event_date));

  const formatTime = (time: string | null) => {
    if (!time) return null;
    return time.slice(0, 5);
  };

  const getEventTypeLabel = (type: string | null) => {
    const types: Record<string, string> = {
      noivas: 'Noiva',
      madrinhas: 'Madrinha',
      debutantes: 'Debutante',
      formandas: 'Formanda',
      ensaio: 'Ensaio',
      outro: 'Outro'
    };
    return types[type || ''] || type || 'Evento';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  if (!assistantInfo && !loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="font-poppins font-bold text-xl text-foreground">
                  Beauty Pro
                </span>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Acesso não autorizado</h2>
              <p className="text-muted-foreground mb-6">
                Você não está registrada como assistente. Entre em contato com a profissional que te convidou.
              </p>
              <Button variant="outline" onClick={handleSignOut}>
                Sair
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-poppins font-bold text-xl text-foreground">
                  Beauty Pro
                </span>
                <Badge variant="secondary" className="ml-2">Assistente</Badge>
              </div>
            </Link>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {assistantInfo?.name}
              </span>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-poppins font-bold text-3xl text-foreground mb-2">
            Olá, {assistantInfo?.name}! 👋
          </h1>
          <p className="text-muted-foreground">
            Veja seus eventos e tarefas atribuídas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Column */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </span>
                  <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  locale={ptBR}
                  modifiers={{
                    hasEvent: eventDates
                  }}
                  modifiersStyles={{
                    hasEvent: {
                      backgroundColor: 'hsl(var(--primary) / 0.2)',
                      borderRadius: '50%'
                    }
                  }}
                  className="pointer-events-auto"
                />
              </CardContent>
            </Card>
          </div>

          {/* Events & Tasks Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Events for Selected Date */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Eventos do Dia
                </CardTitle>
                <CardDescription>
                  {selectedDate
                    ? format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : 'Selecione uma data'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : eventsOnDate.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum evento nesta data.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {eventsOnDate.map(event => (
                      <div
                        key={event.id}
                        className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                        style={{ borderLeftColor: event.color || 'hsl(var(--primary))', borderLeftWidth: '4px' }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{event.title}</h3>
                            <Badge variant="outline" className="mt-1">
                              {getEventTypeLabel(event.event_type)}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {event.client && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>Cliente: {event.client.name}</span>
                            </div>
                          )}
                          
                          {event.arrival_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Chegada: {formatTime(event.arrival_time)}</span>
                            </div>
                          )}
                          
                          {event.making_of_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Making of: {formatTime(event.making_of_time)}</span>
                            </div>
                          )}

                          {event.ceremony_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Cerimônia: {formatTime(event.ceremony_time)}</span>
                            </div>
                          )}

                          {(event.start_time || event.end_time) && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {formatTime(event.start_time)}
                                {event.end_time && ` - ${formatTime(event.end_time)}`}
                              </span>
                            </div>
                          )}

                          {(event.address || event.location) && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{event.address || event.location}</span>
                            </div>
                          )}

                          {event.notes && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              {event.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Tarefas
                </CardTitle>
                <CardDescription>
                  Tarefas dos seus projetos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma tarefa atribuída.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map(task => (
                      <div
                        key={task.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          task.is_completed ? 'bg-muted/50' : 'bg-card'
                        }`}
                      >
                        {task.is_completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {task.project && (
                              <Badge variant="secondary" className="text-xs">
                                {task.project.name}
                              </Badge>
                            )}
                            {task.due_date && (
                              <span>
                                Prazo: {format(parseISO(task.due_date), 'dd/MM/yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
