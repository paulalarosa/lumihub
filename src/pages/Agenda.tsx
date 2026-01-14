import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Menu,
  Link as LinkIcon
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
        color: '#4285F4', // Google Blue
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>

              {/* Mobile sidebar trigger */}
              {isMobile && (
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="border-white/10 bg-transparent text-white/70">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-4 bg-[#050505] border-r-white/10">
                    {sidebarContent}
                  </SheetContent>
                </Sheet>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00e5ff]/10 rounded-xl flex items-center justify-center border border-[#00e5ff]/20">
                  <CalendarIcon className="h-5 w-5 text-[#00e5ff]" />
                </div>
                <span className="font-bold text-xl text-white hidden sm:inline">
                  Agenda
                </span>
              </div>
            </div>

            <Button
              onClick={handleConnectGoogle}
              variant="outline"
              className="gap-2 border-white/10 text-white/70 hover:text-white hover:bg-white/5 hover:border-[#00e5ff]/30"
            >
              <LinkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Conectar Google Agenda</span>
            </Button>
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
          <div className="flex-1 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm overflow-hidden min-h-[500px]">
            {loadingEvents ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00e5ff]"></div>
              </div>
            ) : (
              <EventListView
                events={allEvents}
                selectedDate={selectedDate}
                currentDate={currentDate}
                onEditEvent={handleEventClick} // Changed from handleEditEvent to open Sidebar
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
          // If we were editing from sidebar, keep sidebar closed or refresh it? 
          // Currently onSuccess closes dialog. Sidebar might need to refresh if it's open.
        }}
      />

      <EventDetailsSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        event={editingEvent} // Reusing editingEvent state for selected event
        onEdit={(e) => {
          setSidebarOpen(false);
          handleEditEvent(e);
        }}
        onDelete={(id) => {
          handleDeleteEvent(id);
          setSidebarOpen(false);
        }}
        userRole={isAdmin ? 'admin' : 'assistant'} // Using isAdmin from useAuth
      />
    </div>
  );
}
