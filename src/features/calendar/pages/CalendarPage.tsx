import SEOHead from '@/components/seo/SEOHead'
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, dateFnsLocalizer, View, ToolbarProps } from 'react-big-calendar'
import { format } from 'date-fns/format'
import { parse } from 'date-fns/parse'
import { startOfWeek } from 'date-fns/startOfWeek'
import { getDay } from 'date-fns/getDay'
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatDate } from '@/lib/date-utils'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { invokeEdgeFunction } from '@/lib/invokeEdge'
import { useAuth } from '@/hooks/useAuth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  RefreshCw,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { EventDetailsModal } from '@/components/calendar/EventDetailsModal'
import { CreateEventModal } from '@/components/calendar/CreateEventModal'
import { GoogleCalendarSettings } from '@/components/calendar/GoogleCalendarSettings'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { ConflictResolver } from '@/components/calendar/ConflictResolver'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/PageLoader'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { useEvents } from '../hooks/useEvents'

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
    eventType: string
    status: string
    projectId?: string
    isSynced: boolean
    googleEventId?: string
    serviceType: string
    raw: unknown
  }
}

const EVENT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  wedding:  { bg: '#d4af72', text: '#000', label: 'Noiva'     },
  social:   { bg: '#c084a8', text: '#fff', label: 'Social'    },
  project:  { bg: '#4db8c8', text: '#000', label: 'Projeto'   },
  personal: { bg: '#8b78d8', text: '#fff', label: 'Pessoal'   },
  blocked:  { bg: '#e05252', text: '#fff', label: 'Bloqueado' },
  test:     { bg: '#5a5a5a', text: '#fff', label: 'Teste'     },
}

const VIEW_LABELS: Record<string, string> = {
  month: 'Mês', week: 'Semana', day: 'Dia', agenda: 'Lista',
}

function CustomToolbar({ onNavigate, onView, view, label }: ToolbarProps<CalendarEvent, object>) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b border-white/10 gap-4">

      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 h-8 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-white border border-white/10 hover:border-white/30 transition-all"
        >
          Hoje
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all"
          aria-label="Próximo"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <span className="font-serif text-lg text-white capitalize ml-3 tracking-tight">
          {label}
        </span>
      </div>

      <div className="flex items-center border border-white/10">
        {(['month', 'week', 'day', 'agenda'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => onView(v)}
            className={`px-4 h-8 text-[10px] font-mono uppercase tracking-widest transition-all ${
              view === v
                ? 'bg-white text-black'
                : 'text-white/35 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  )
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

  const range = useMemo(() => {
    return { start: startOfMonth(date), end: endOfMonth(date) }
  }, [date])

  const { data: unifiedEvents, isLoading, isError } = useEvents(range.start, range.end)

  const events = useMemo((): CalendarEvent[] => {
    if (!unifiedEvents) return []
    return unifiedEvents.map((event) => {
      const eventDate = parse(event.event_date, 'yyyy-MM-dd', new Date())
      let start: Date
      let end: Date

      if (event.start_time) {
        const [h, m] = event.start_time.split(':').map(Number)
        start = new Date(eventDate)
        start.setHours(h, m, 0)
      } else {
        start = startOfDay(eventDate)
      }

      if (event.end_time) {
        const [h, m] = event.end_time.split(':').map(Number)
        end = new Date(eventDate)
        end.setHours(h, m, 0)
      } else {
        end = endOfDay(eventDate)
      }

      return {
        id: event.id,
        title: event.title,
        start,
        end,
        resource: {
          eventId: event.id,
          eventType: event.event_type || 'wedding',
          status: (event as unknown as Record<string, unknown>).status as string || 'confirmed',
          projectId: event.project_id,
          isSynced: !!(event as unknown as Record<string, unknown>).google_calendar_event_id,
          googleEventId: (event as unknown as Record<string, unknown>).google_calendar_event_id as string,
          serviceType: '',
          raw: event,
        },
      }
    })
  }, [unifiedEvents])

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeEdgeFunction(
        'google-calendar-sync',
        { action: 'sync-from-google', user_id: user?.id },
        { passUserToken: true },
      )
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR_EVENTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      toast.success('Sincronização concluída!')
    },
    onError: (error: Error) => {
      toast.error('Erro na sincronização: ' + error.message)
    },
  })

  const eventStyleGetter = (event: CalendarEvent) => {
    const color = EVENT_COLORS[event.resource.eventType] ?? EVENT_COLORS.wedding
    const isPast = event.end < new Date()
    const isToday =
      formatDate(event.start, 'yyyy-MM-dd') === formatDate(new Date(), 'yyyy-MM-dd')

    return {
      style: {
        backgroundColor: color.bg,
        color: color.text,
        opacity: isPast ? 0.45 : 1,
        outline: isToday ? `2px solid rgba(255,255,255,0.5)` : 'none',
        outlineOffset: '1px',
        borderRadius: '2px',
        padding: '2px 6px',
        fontSize: '11px',
        fontWeight: 500,
        border: 'none',
      },
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

  const handleEventCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['events'] })
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR_EVENTS] })
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
    setIsCreateModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black">
      <SEOHead title="Agenda" noindex={true} />

      <header className="border-b border-white/15 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white hover:text-black rounded-none h-9 w-9"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 border border-white/20 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="font-serif text-xl text-white uppercase tracking-tight leading-none">
                    AGENDA
                  </h1>
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.25em] mt-0.5 flex items-center gap-1.5">
                    Gestão de eventos
                    {isConnected ? (
                      <span className="flex items-center gap-1 text-emerald-400/70">
                        <Wifi className="w-2.5 h-2.5" />
                        Google
                      </span>
                    ) : !isGoogleLoading ? (
                      <span className="flex items-center gap-1 text-white/20">
                        <WifiOff className="w-2.5 h-2.5" />
                        Offline
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="rounded-none border-white/15 text-white/60 hover:bg-white hover:text-black h-9 text-xs font-mono uppercase tracking-widest px-3"
                >
                  <RefreshCw
                    className={`w-3 h-3 mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`}
                  />
                  Sync
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
                className="rounded-none border-white/15 text-white/60 hover:bg-white hover:text-black h-9 text-xs font-mono uppercase tracking-widest px-3"
              >
                <Settings className="w-3 h-3 mr-1.5" />
                Config
              </Button>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded-none bg-white text-black hover:bg-gray-100 h-9 text-xs font-mono uppercase tracking-widest px-4 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Evento
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-white/[0.05] bg-black">
        <div className="container mx-auto px-4 py-3 flex items-center gap-5 flex-wrap">
          {Object.values(EVENT_COLORS).map(({ bg, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: bg }}
              />
              <span className="text-[9px] text-white/30 uppercase tracking-[0.15em]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <ConflictResolver />

        {!isConnected && !isGoogleLoading && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 border border-white/10 bg-white/[0.02]">
            <WifiOff className="w-4 h-4 text-white/30 flex-shrink-0" />
            <p className="text-xs text-white/40">
              Google Calendar não conectado.{' '}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-white/60 hover:text-white underline underline-offset-2 transition-colors"
              >
                Conectar agora
              </button>
            </p>
          </div>
        )}

        <div className="calendar-dark border border-white/10 bg-white/[0.01] overflow-hidden">
          {isLoading ? (
            <div className="h-[680px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <LoadingSpinner />
                <p className="text-xs text-white/20 uppercase tracking-widest font-mono">
                  Carregando agenda...
                </p>
              </div>
            </div>
          ) : isError ? (
            <div className="h-[680px] flex flex-col items-center justify-center gap-3">
              <CalendarIcon className="w-10 h-10 text-white/10" />
              <p className="text-sm text-white/20 uppercase tracking-widest font-mono">
                Erro ao carregar agenda
              </p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['events'] })}
                className="text-xs text-white/30 hover:text-white underline underline-offset-2 transition-colors font-mono uppercase tracking-widest"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 680 }}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              culture="pt-BR"
              components={{ toolbar: CustomToolbar }}
              messages={{
                today: 'Hoje',
                previous: 'Anterior',
                next: 'Próximo',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
                agenda: 'Lista',
                date: 'Data',
                time: 'Hora',
                event: 'Evento',
                noEventsInRange: 'Nenhum evento neste período',
                showMore: (count) => `+${count} eventos`,
              }}
            />
          )}
        </div>
      </div>

      <EventDetailsModal
        event={selectedEvent}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialDate={createEventDate}
        onSuccess={handleEventCreated}
      />

      <GoogleCalendarSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}

export default CalendarPage
