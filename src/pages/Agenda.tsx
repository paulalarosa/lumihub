import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  ArrowLeft,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EventDialog from '@/components/agenda/EventDialog';
import EventCard from '@/components/agenda/EventCard';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  color: string;
  client_id: string | null;
  project_id: string | null;
  reminder_days: number[];
  client?: { name: string } | null;
  project?: { name: string } | null;
  assistants?: { id: string; name: string }[];
}

interface Assistant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export default function Agenda() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchAssistants();
    }
  }, [user, currentMonth]);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        client:clients(name),
        project:projects(name)
      `)
      .gte('event_date', format(start, 'yyyy-MM-dd'))
      .lte('event_date', format(end, 'yyyy-MM-dd'))
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos",
        variant: "destructive"
      });
    } else {
      // Fetch assistants for each event
      const eventsWithAssistants = await Promise.all(
        (data || []).map(async (event) => {
          const { data: eventAssistants } = await supabase
            .from('event_assistants')
            .select('assistant_id, assistants(id, name)')
            .eq('event_id', event.id);
          
          return {
            ...event,
            assistants: eventAssistants?.map((ea: any) => ea.assistants) || []
          };
        })
      );
      setEvents(eventsWithAssistants as Event[]);
    }
    setLoadingEvents(false);
  };

  const fetchAssistants = async () => {
    const { data, error } = await supabase
      .from('assistants')
      .select('*')
      .order('name');

    if (!error && data) {
      setAssistants(data);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setViewMode('day');
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setDialogOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setDialogOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o evento",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Evento excluído"
      });
      fetchEvents();
    }
  };

  const eventsForSelectedDate = selectedDate
    ? events.filter(e => isSameDay(new Date(e.event_date), selectedDate))
    : [];

  const daysWithEvents = events.map(e => new Date(e.event_date));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <span className="font-poppins font-bold text-xl text-foreground">
                  Agenda
                </span>
              </div>
            </div>
            <Button onClick={handleCreateEvent} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Evento
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-lg">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={ptBR}
                modifiers={{
                  hasEvent: daysWithEvents
                }}
                modifiersClassNames={{
                  hasEvent: 'bg-primary/20 font-bold'
                }}
                className="rounded-md"
              />
              
              {/* Assistants Quick List */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assistentes
                  </h3>
                  <Link to="/assistentes">
                    <Button variant="ghost" size="sm">
                      Gerenciar
                    </Button>
                  </Link>
                </div>
                <div className="space-y-2">
                  {assistants.slice(0, 5).map(assistant => (
                    <div key={assistant.id} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>{assistant.name}</span>
                    </div>
                  ))}
                  {assistants.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma assistente cadastrada
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {viewMode === 'day' && selectedDate ? (
                    <>
                      <CalendarIcon className="h-5 w-5" />
                      {format(selectedDate, "dd 'de' MMMM, EEEE", { locale: ptBR })}
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="h-5 w-5" />
                      Eventos do Mês
                    </>
                  )}
                </CardTitle>
                {viewMode === 'day' && (
                  <Button variant="ghost" size="sm" onClick={() => setViewMode('month')}>
                    Ver todos
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(viewMode === 'day' ? eventsForSelectedDate : events).length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">
                        {viewMode === 'day' 
                          ? 'Nenhum evento para esta data'
                          : 'Nenhum evento este mês'}
                      </p>
                      <Button onClick={handleCreateEvent} variant="outline" className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Evento
                      </Button>
                    </div>
                  ) : (
                    (viewMode === 'day' ? eventsForSelectedDate : events).map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEdit={() => handleEditEvent(event)}
                        onDelete={() => handleDeleteEvent(event.id)}
                        showDate={viewMode === 'month'}
                      />
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        assistants={assistants}
        selectedDate={selectedDate}
        onSuccess={() => {
          fetchEvents();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
