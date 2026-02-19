import { useState } from 'react'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, RefreshCw, Settings } from 'lucide-react'
import { EventDetailsModal } from '@/components/calendar/EventDetailsModal'
import { CreateEventModal } from '@/components/calendar/CreateEventModal'
import { GoogleCalendarSettings } from '@/components/calendar/GoogleCalendarSettings'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { ConflictResolver } from '@/components/calendar/ConflictResolver'
import { toast } from 'sonner'

const locales = { 'pt-BR': ptBR }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    eventId: string
    eventType: 'wedding' | 'social' | 'test' | 'personal' | 'blocked'
    status: string
    projectId?: string
    isSynced: boolean
    googleEventId?: string
  }
}

export const CalendarPage = () => {
  const { user } = useAuth()
  const { isConnected, isLoading: isGoogleLoading } = useGoogleCalendar()
  const queryClient = useQueryClient()

  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createEventDate, setCreateEventDate] = useState<Date | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Fetch events from Supabase
  const {
    data: events,
    isLoading,
    _refetch,
  } = useQuery({
    queryKey: ['calendar-events', user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true })

      if (error) throw error

      return data.map((event) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        resource: {
          eventId: event.id,
          eventType: event.event_type,
          status: event.status,
          projectId: event.project_id,
          isSynced: event.is_synced || false,
          googleEventId: event.google_event_id,
        },
      })) as CalendarEvent[]
    },
    enabled: !!user,
  })

  // Force sync with Google Calendar
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        'force-calendar-sync',
        {
          body: { user_id: user?.id },
        },
      )

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      toast.success('Sincronização concluída!')
    },
    onError: (error: Error) => {
      toast.error('Erro na sincronização: ' + error.message)
    },
  })

  // Event style based on type and sync status
  const eventStyleGetter = (event: CalendarEvent) => {
    const colors: Record<string, { bg: string; text: string }> = {
      wedding: { bg: '#FFD700', text: '#000' },
      social: { bg: '#FF69B4', text: '#fff' },
      test: { bg: '#6B7280', text: '#fff' },
      personal: { bg: '#8B5CF6', text: '#fff' },
      blocked: { bg: '#EF4444', text: '#fff' },
    }

    const color = colors[event.resource.eventType] || colors.personal
    const isPast = event.end < new Date()
    const isToday =
      format(event.start, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

    return {
      style: {
        backgroundColor: color.bg,
        color: color.text,
        opacity: isPast ? 0.5 : 1,
        border: isToday ? '2px solid #00ff00' : 'none',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '13px',
        fontWeight: 500,
        position: 'relative' as const,
        // Indicador de sync - handled via css classes better but simple object works
      },
      // Adding sync indicator via title modification if needed or custom component
    }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsDetailsModalOpen(true)
  }

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setCreateEventDate(start)
    setIsCreateModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-8 h-8" />
              Agenda
            </h1>
            <p className="text-neutral-400 mt-1">
              Visualização de eventos
              {isConnected && (
                <span className="ml-2 text-green-500 text-sm">
                  ☁ Sincronizado com Google Calendar
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            {isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="hover:bg-neutral-800"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`}
                />
                Sincronizar
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              className="hover:bg-neutral-800"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setDate(new Date())}
              className="hover:bg-neutral-800"
            >
              Hoje
            </Button>

            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white text-black hover:bg-neutral-200"
            >
              + Novo Evento
            </Button>
          </div>
        </div>

        {/* Conflict Resolver */}
        <ConflictResolver />

        {/* Google Calendar Connection Warning */}
        {!isConnected && !isGoogleLoading && (
          <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg">
            <p className="text-yellow-400 text-sm">
              ⚠️ Google Calendar não conectado.
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="ml-2 underline hover:text-yellow-300"
              >
                Clique aqui para conectar
              </button>
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#FFD700' }}
            />
            <span className="text-sm text-neutral-300">Noiva</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#FF69B4' }}
            />
            <span className="text-sm text-neutral-300">Social</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#6B7280' }}
            />
            <span className="text-sm text-neutral-300">Teste</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#8B5CF6' }}
            />
            <span className="text-sm text-neutral-300">Pessoal (Google)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#EF4444' }}
            />
            <span className="text-sm text-neutral-300">Bloqueado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-300 text-sm">☁ = Sincronizado</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 calendar-dark">
          {isLoading ? (
            <div className="h-[700px] flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events || []}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 700 }}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              culture="pt-BR"
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
                noEventsInRange: 'Nenhum evento neste período',
              }}
            />
          )}
        </div>

        {/* Modals */}
        <EventDetailsModal
          event={selectedEvent}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        />

        <CreateEventModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          initialDate={createEventDate}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
            setIsCreateModalOpen(false)
          }}
        />

        <GoogleCalendarSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </div>
  )
}

export default CalendarPage
