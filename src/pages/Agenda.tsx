import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Menu,
  Link as LinkIcon,
  Terminal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EventDialog from '@/components/agenda/EventDialog';
import { EventDetailsSidebar } from '@/components/agenda/EventDetailsSidebar';
import { CalendarHeader } from '@/components/agenda/CalendarHeader';
import { CalendarSidebar, CalendarSize } from '@/components/agenda/CalendarSidebar';
import { EventListView } from '@/components/agenda/views/EventListView';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { getCalendarEvents, GoogleCalendarEvent } from '@/integrations/google/calendar';

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
  const { user, loading, signInWithGoogle, isAdmin } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [events, setEvents] = useState<Event[]>([]);
  const [googleEvents, setGoogleEvents] = useState<Event[]>([]);
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
      fetchGoogleEventsData();
    }
  }, [user, currentDate]);

  const fetchGoogleEventsData = async () => {
    const gEvents = await getCalendarEvents();

    // Map Google Events to our Event interface
    const mappedEvents: Event[] = gEvents.map((gEvent: GoogleCalendarEvent) => {
      const start = gEvent.start.dateTime || gEvent.start.date || new Date().toISOString();
      const end = gEvent.end.dateTime || gEvent.end.date || new Date().toISOString();
      const startDate = new Date(start);
      // For full day events, start.date is used. We should handle the time parsing carefully.

      return {
        id: gEvent.id,
        title: gEvent.summary || '(Sem título)',
        description: gEvent.description || null,
        event_date: format(startDate, 'yyyy-MM-dd'),
        event_type: 'google', // Custom type for google events
        start_time: gEvent.start.dateTime ? format(startDate, 'HH:mm') : null,
        end_time: gEvent.end.dateTime ? format(new Date(end), 'HH:mm') : null,
        arrival_time: null,
        making_of_time: null,
        ceremony_time: null,
        advisory_time: null,
        location: gEvent.location || null,
        address: gEvent.location || null,
        notes: gEvent.htmlLink, // Storing link in notes for now
        color: '#FFFFFF', // Monochrome
        client_id: null,
        project_id: null,
        reminder_days: [],
        client: { name: 'Google Agenda' },
        project: null,
        assistants: []
      };
    });

    setGoogleEvents(mappedEvents);
  };

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

  const handleEventClick = (event: Event) => {
    setEditingEvent(event);
    setSidebarOpen(true);
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
    // If it's a google event, we currently don't support deleting from here
    if (eventId.length > 36) { // Heuristic: uuid is 36 chars. Google IDs are usually different (or we check event_type)
      // Better to check specific property or separate lists
    }
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

  const handleConnectGoogle = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      console.error("Error connecting to Google:", error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao Google Agenda",
        variant: "destructive"
      });
    }
  };

  const allEvents = [...events, ...googleEvents];

  const sidebarContent = (
    <CalendarSidebar
      currentDate={currentDate}
      selectedDate={selectedDate}
      onDateSelect={handleDateSelect}
      onMonthChange={handleMonthChange}
      onClearDateFilter={handleClearDateFilter}
      assistants={assistants}
      events={allEvents}
      calendarSize={calendarSize}
      onCalendarSizeChange={setCalendarSize}
    />
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col text-white font-mono selection:bg-white selection:text-black">
      {/* Header */}
      <header className="border-b border-white/20 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="rounded-none text-white hover:text-black hover:bg-white transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>

              {/* Mobile sidebar trigger */}
              {isMobile && (
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-none border-white/20 bg-transparent text-white hover:bg-white/10">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0 bg-black border-r border-white/20 rounded-none">
                    <div className="p-4">
                      {sidebarContent}
                    </div>
                  </SheetContent>
                </Sheet>
              )}

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-white/20 bg-black flex items-center justify-center rounded-none hover:bg-white hover:text-black transition-all group">
                  <Terminal className="h-5 w-5 text-white group-hover:text-black transition-colors" />
                </div>
                <span className="font-serif font-bold text-2xl text-white uppercase tracking-tighter hidden sm:inline">
                  AGENDA // SYSTEM
                </span>
              </div>
            </div>

            <Button
              onClick={handleConnectGoogle}
              variant="outline"
              className="gap-2 rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest h-10"
            >
              <LinkIcon className="h-3 w-3" />
              <span className="hidden sm:inline">LINK_GOOGLE_CALENDAR</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8 flex flex-col min-h-0">
        {/* Calendar Header */}
        <div className="mb-6">
          <CalendarHeader
            currentDate={currentDate}
            onNavigate={handleNavigate}
            onToday={handleToday}
            onCreateEvent={handleCreateEvent}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-8 mt-2 min-h-0">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <div className="w-80 shrink-0 border border-white/20 p-4 bg-black">
              {sidebarContent}
            </div>
          )}

          {/* Event List View */}
          <div className="flex-1 border border-white/20 bg-black relative min-h-[500px]">
            {/* Grid background effect */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}>
            </div>

            {loadingEvents ? (
              <div className="flex items-center justify-center h-full relative z-10">
                <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="relative z-10 h-full">
                <EventListView
                  events={allEvents}
                  selectedDate={selectedDate}
                  currentDate={currentDate}
                  onEditEvent={handleEventClick}
                  onDeleteEvent={handleDeleteEvent}
                />
              </div>
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

      <EventDetailsSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        event={editingEvent}
        onEdit={(e) => {
          setSidebarOpen(false);
          handleEditEvent(e);
        }}
        onDelete={(id) => {
          handleDeleteEvent(id);
          setSidebarOpen(false);
        }}
        userRole={isAdmin ? 'admin' : 'assistant'}
      />
    </div>
  );
}
