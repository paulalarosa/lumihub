import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  Menu
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EventDialog from '@/components/agenda/EventDialog';
import { CalendarHeader } from '@/components/agenda/CalendarHeader';
import { CalendarSidebar, CalendarSize } from '@/components/agenda/CalendarSidebar';
import { EventListView } from '@/components/agenda/views/EventListView';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string | null;
  start_time: string | null;
  end_time: string | null;
  arrival_time: string | null;
  making_of_time: string | null;
  ceremony_time: string | null;
  advisory_time: string | null;
  location: string | null;
  address: string | null;
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
  const isMobile = useIsMobile();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calendarSize, setCalendarSize] = useState<CalendarSize>('small');

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
  }, [user, currentDate]);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    
    // Always fetch full month plus surrounding days for calendar display
    const fetchStart = startOfWeek(startOfMonth(currentDate), { locale: ptBR });
    const fetchEnd = endOfWeek(endOfMonth(currentDate), { locale: ptBR });

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        client:clients(name),
        project:projects(name)
      `)
      .gte('event_date', format(fetchStart, 'yyyy-MM-dd'))
      .lte('event_date', format(fetchEnd, 'yyyy-MM-dd'))
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

  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
    setSelectedDate(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSidebarOpen(false);
  };

  const handleClearDateFilter = () => {
    setSelectedDate(null);
  };

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
    setSelectedDate(null);
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

  const sidebarContent = (
    <CalendarSidebar
      currentDate={currentDate}
      selectedDate={selectedDate}
      onDateSelect={handleDateSelect}
      onMonthChange={handleMonthChange}
      onClearDateFilter={handleClearDateFilter}
      assistants={assistants}
      events={events}
      calendarSize={calendarSize}
      onCalendarSizeChange={setCalendarSize}
    />
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            
            {/* Mobile sidebar trigger */}
            {isMobile && (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-4">
                  {sidebarContent}
                </SheetContent>
              </Sheet>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground hidden sm:inline">
                Agenda
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col min-h-0">
        {/* Calendar Header */}
        <CalendarHeader
          currentDate={currentDate}
          onNavigate={handleNavigate}
          onToday={handleToday}
          onCreateEvent={handleCreateEvent}
        />

        {/* Main Content */}
        <div className="flex-1 flex gap-6 mt-6 min-h-0">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <div className="w-72 shrink-0">
              {sidebarContent}
            </div>
          )}

          {/* Event List View */}
          <div className="flex-1 border rounded-lg bg-card overflow-hidden min-h-[500px]">
            {loadingEvents ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <EventListView
                events={events}
                selectedDate={selectedDate}
                currentDate={currentDate}
                onEditEvent={handleEditEvent}
                onDeleteEvent={handleDeleteEvent}
              />
            )}
          </div>
        </div>
      </main>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        assistants={assistants}
        selectedDate={selectedDate || undefined}
        onSuccess={() => {
          fetchEvents();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
