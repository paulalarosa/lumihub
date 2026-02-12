
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { EventDetailsModal } from '@/components/calendar/EventDetailsModal';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Custom styles must be imported in App.tsx or here if supported by bundler
// import '@/styles/calendar.css'; 

const locales = {
    'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
    getDay,
    locales,
});

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource: {
        projectId?: string;
        googleEventId?: string;
        description?: string;
        location?: string;
        serviceType: string; // 'wedding', 'social', 'test', 'personal', etc
        clientName?: string;
        clientPhone?: string;
        status: string;
    };
}

export const CalendarPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { isConnected, connectGoogleCalendar, disconnectGoogleCalendar, checkConnection } = useGoogleCalendar();

    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [view, setView] = useState<View>('month');
    const [date, setDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch events from Supabase (consolidated table)
    useEffect(() => {
        fetchEvents();
    }, [user]);

    const fetchEvents = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            // 1. Fetch Internal Projects
            // Casting to any because we are joining and types might be incomplete
            const { data: projectsData, error: projectsError } = await (supabase
                .from('projects')
                .select('*, client:wedding_clients(name, phone)')
                .eq('makeup_artist_id', user.id) as any);

            if (projectsError) throw projectsError;
            const projects = projectsData as any[];

            // 2. Fetch Google Events
            // Casting query to any to bypass strict check on new table
            const { data: googleEventsData, error: googleError } = await (supabase
                .from('calendar_events' as any)
                .select('*')
                .eq('user_id', user.id)
                .eq('event_type', 'personal') as any);

            if (googleError) throw googleError;
            const googleEvents = googleEventsData as any[];

            const internalEvents: CalendarEvent[] = (projects || []).map((project) => {
                const dateStr = project.event_date; // YYYY-MM-DD
                let startDate = new Date(dateStr);

                // Adjust for time if available
                if (project.event_time) {
                    // Combine date and time
                    const dateTimeStr = `${dateStr}T${project.event_time}`;
                    startDate = new Date(dateTimeStr);
                } else {
                    // Default to 12:00 if no time
                    startDate.setHours(12, 0, 0, 0);
                }

                const endDate = new Date(startDate);
                endDate.setHours(endDate.getHours() + 4); // Default duration 4h for events

                return {
                    id: project.id,
                    title: project.client?.name || 'Projeto Sem Cliente',
                    start: startDate,
                    end: endDate,
                    resource: {
                        projectId: project.id,
                        serviceType: 'social', // Defaulting to social as project type might be missing
                        clientName: project.client?.name,
                        clientPhone: project.client?.phone,
                        status: project.status,
                    },
                };
            });

            const externalEvents: CalendarEvent[] = (googleEvents || []).map((evt) => ({
                id: evt.id,
                title: evt.title,
                start: new Date(evt.start_time),
                end: new Date(evt.end_time),
                resource: {
                    googleEventId: evt.google_event_id,
                    description: evt.description,
                    location: evt.location,
                    serviceType: 'personal',
                    status: evt.status || 'confirmed',
                }
            }));

            setEvents([...internalEvents, ...externalEvents]);

        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Erro ao carregar eventos');
        } finally {
            setIsLoading(false);
        }
    };

    // Event style (cores por tipo)
    const eventStyleGetter = (event: CalendarEvent) => {
        const colors: Record<string, { backgroundColor: string, color: string }> = {
            wedding: { backgroundColor: '#FFD700', color: '#000' },
            social: { backgroundColor: '#FF69B4', color: '#fff' },
            test: { backgroundColor: '#6B7280', color: '#fff' },
            personal: { backgroundColor: '#3b82f6', color: '#fff' }, // Blue for Google
        };

        const isPast = event.end < new Date();
        const style = colors[event.resource.serviceType] || colors.social;

        return {
            style: {
                ...style,
                opacity: isPast ? 0.6 : 1,
                border: format(event.start, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    ? '2px solid #fff'
                    : 'none',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '12px',
                fontWeight: 600,
                color: style.color
            },
        };
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleSelectSlot = ({ start }: { start: Date }) => {
        // Basic navigation to create new project
        navigate(`/projects/new?date=${format(start, 'yyyy-MM-dd')}`);
    };

    return (
        <div className="min-h-screen bg-neutral-950 p-4 md:p-8 animate-fade-in">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Agenda</h1>
                        <p className="text-neutral-400 mt-1">Gerencie seus projetos e eventos sincronizados</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                        {!isConnected ? (
                            <Button variant="outline" onClick={connectGoogleCalendar} className="gap-2">
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                                Conectar Google
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={disconnectGoogleCalendar} className="gap-2 border-green-900 bg-green-900/10 text-green-400 hover:bg-green-900/20">
                                <Check className="w-4 h-4" />
                                Sincronizado
                            </Button>
                        )}

                        <Button
                            variant="secondary"
                            onClick={() => setDate(new Date())}
                        >
                            Hoje
                        </Button>

                        <Button onClick={() => fetchEvents()} disabled={isLoading} variant="ghost" size="icon">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>

                        <Button onClick={() => navigate('/projects/new')} className="bg-white text-black hover:bg-neutral-200">
                            + Novo Projeto
                        </Button>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#FFD700]" />
                        <span className="text-sm text-neutral-300">Noiva</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#FF69B4]" />
                        <span className="text-sm text-neutral-300">Social</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#6B7280]" />
                        <span className="text-sm text-neutral-300">Teste</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                        <span className="text-sm text-neutral-300">Google Calendar</span>
                    </div>
                </div>

                {/* Calendar Component */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-1 md:p-6 calendar-dark shadow-2xl">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 750 }}
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={handleSelectEvent}
                        onSelectSlot={handleSelectSlot}
                        selectable
                        popup
                        messages={{
                            today: 'Hoje',
                            previous: 'Anterior',
                            next: 'Próximo',
                            month: 'Mês',
                            week: 'Semana',
                            day: 'Dia',
                            agenda: 'Agenda',
                            date: 'Data',
                            time: 'Hora',
                            event: 'Evento',
                            noEventsInRange: 'Sem eventos neste período',
                            showMore: (total) => `+${total} mais`,
                        }}
                        culture='pt-BR'
                    />
                </div>

                {/* Details Modal */}
                {selectedEvent && (
                    <EventDetailsModal
                        event={selectedEvent}
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default CalendarPage;
