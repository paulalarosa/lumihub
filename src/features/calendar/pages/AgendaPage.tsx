
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Menu,
    Link as LinkIcon,
    Terminal,
} from 'lucide-react';
import { MobileFAB } from '@/components/ui/MobileFAB';
import { useToast } from '@/hooks/use-toast';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EventDialog from '@/components/agenda/EventDialog';
import { EventDetailsSidebar } from '@/components/agenda/EventDetailsSidebar';
import { CalendarHeader } from '@/components/agenda/CalendarHeader';
import { CalendarSidebar, CalendarSize } from '@/components/agenda/CalendarSidebar';
import { EventListView } from '@/components/agenda/views/EventListView';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEvents, Event } from '@/hooks/useEvents';
import { useAgenda } from '../hooks/useAgenda';

export default function AgendaPage() {
    const navigate = useNavigate();
    const { user, loading: authLoading, signInWithGoogle, role } = useAuth();
    const isAdmin = role === 'admin' || role === 'professional';
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const [currentDate, setCurrentDate] = useState(new Date());

    // Date Range for Supabase Fetch
    const fetchStart = startOfWeek(startOfMonth(currentDate), { locale: ptBR });
    const fetchEnd = endOfWeek(endOfMonth(currentDate), { locale: ptBR });

    // Hooks
    const {
        assistants,
        googleEvents,
        isLoadingAssistants,
        isLoadingGoogle,
        refetchGoogle
    } = useAgenda(fetchStart, fetchEnd);

    const {
        data: supabaseEvents,
        isLoading: isLoadingSupabase,
        refetch: refetchSupabase
    } = useEvents(fetchStart, fetchEnd);

    // State
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [calendarSize, setCalendarSize] = useState<CalendarSize>('small');

    // Auth Check
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/auth');
        }
    }, [user, authLoading, navigate]);

    // Derived State (Deduplication)
    const allEvents = useMemo(() => {
        const mergedRaw = [...googleEvents, ...(supabaseEvents || [])];
        return Array.from(new Map(mergedRaw.map(e => [e.google_calendar_event_id || e.id, e])).values());
    }, [googleEvents, supabaseEvents]);

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
        const eventToDelete = allEvents.find(e => e.id === eventId);

        // Google Event Deletion
        if (eventToDelete?.google_calendar_event_id) {
            // Dynamic import to avoid heavy load if unused? 
            // Logic kept from original file
            const { deleteCalendarEvent } = await import('@/integrations/google/calendar');
            const googleDeleted = await deleteCalendarEvent(eventToDelete.google_calendar_event_id);

            if (!googleDeleted) {
                toast({ title: "Erro no Google Calendar", description: "Não foi possível apagar o evento do Google (verifique console).", variant: "destructive" });
                return;
            }
        } else if (eventId.length > 36) { // Pure Google Event
            const { deleteCalendarEvent } = await import('@/integrations/google/calendar');
            await deleteCalendarEvent(eventId);
            toast({ title: "Evento Google excluído" });
            refetchGoogle();
            return;
        }

        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId);

        if (error) {
            toast({ title: "Erro", description: "Não foi possível excluir o evento", variant: "destructive" });
        } else {
            toast({ title: "Sucesso", description: "Evento excluído" });
            refetchSupabase();
        }
    };

    const handleConnectGoogle = async () => {
        try {
            const { error } = await signInWithGoogle();
            if (error) throw error;
        } catch (error) {
            console.error("Error connecting to Google:", error);
            toast({ title: "Erro de conexão", description: "Não foi possível conectar ao Google Agenda", variant: "destructive" });
        }
    };

    if (authLoading || isLoadingAssistants) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

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

                        {isLoadingSupabase || isLoadingGoogle ? (
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
                    refetchSupabase();
                    // Also refetch Google if we suspect changes? 
                    // Usually createEvent handles Google sync but refetching ensures safety.
                    refetchGoogle();
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
            <MobileFAB onClick={handleCreateEvent} label="Novo Evento" />
        </div>
    );
}
