import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/services/logger'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  LogOut,
  CalendarCheck,
  AlertCircle,
} from 'lucide-react'
import { format, isAfter, startOfToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AssistantUpsellBanner } from '../components/AssistantUpsellBanner'

interface AssistantSession {
  assistantId: string
  assistantName: string
  professionalId: string
  professionalName: string
}

interface EventAssignment {
  event_id: string
  event: {
    id: string
    title: string | null
    event_date: string | null
    start_time: string | null
    end_time: string | null
    location: string | null
    event_type: string | null
    client: { name: string | null } | null
  } | null
}

export default function AssistantFreeDashboard() {
  const { professionalId } = useParams<{ professionalId: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<AssistantSession | null>(null)
  const [events, setEvents] = useState<EventAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!professionalId) return

    const stored = sessionStorage.getItem(`assistant_session_${professionalId}`)

    if (!stored) {
      navigate(`/agenda-equipa/${professionalId}`, { replace: true })
      return
    }

    try {
      const parsed = JSON.parse(stored) as AssistantSession
      setSession(parsed)
    } catch (_e) {
      navigate(`/agenda-equipa/${professionalId}`, { replace: true })
    }
  }, [professionalId, navigate])

  useEffect(() => {
    if (!session) return

    const fetchEvents = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('event_assistants')
          .select(
            `
            event_id,
            event:events(
              id, title, event_date, start_time, end_time, location, event_type,
              client:wedding_clients(name)
            )
          `,
          )
          .eq('assistant_id', session.assistantId)

        if (fetchError) throw fetchError

        const filtered = (data || [])
          .filter((item) => {
            const evt = item.event as unknown as Record<string, unknown> | null
            if (!evt) return false
            const userIdMatch =
              (evt as Record<string, unknown>).user_id ===
              session.professionalId
            return userIdMatch
          })
          .map((item) => ({
            event_id: item.event_id,
            event: item.event as unknown as EventAssignment['event'],
          }))

        setEvents(filtered)
      } catch (err) {
        logger.error(err, 'AssistantFreeDashboard.fetchEvents', {
          showToast: false,
        })
        setError('Não foi possível carregar os eventos.')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [session])

  const handleLogout = () => {
    if (professionalId) {
      sessionStorage.removeItem(`assistant_session_${professionalId}`)
    }
    navigate(`/agenda-equipa/${professionalId}`, { replace: true })
  }

  const upcomingEvents = useMemo(() => {
    const today = startOfToday()
    return events
      .filter((e) => {
        if (!e.event?.event_date) return false
        return (
          isAfter(new Date(e.event.event_date), today) ||
          format(new Date(e.event.event_date), 'yyyy-MM-dd') ===
            format(today, 'yyyy-MM-dd')
        )
      })
      .sort((a, b) => {
        const dateA = a.event?.event_date || ''
        const dateB = b.event?.event_date || ''
        return dateA.localeCompare(dateB)
      })
  }, [events])

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.15 },
    },
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white selection:text-black font-sans">
      <header className="border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarCheck
              className="w-5 h-5 text-white/40"
              strokeWidth={1.5}
            />
            <div>
              <h1 className="text-sm font-sans font-semibold text-white tracking-tight">
                Agenda da Assistente
              </h1>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.15em] mt-0.5">
                {session.professionalName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-white/25 uppercase tracking-wider hidden sm:block">
              {session.assistantName}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5
                         border border-white/10 hover:border-white/20
                         text-[10px] font-mono uppercase tracking-wider text-white/40 hover:text-white/70
                         transition-all duration-200"
            >
              <LogOut className="w-3 h-3" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <AssistantUpsellBanner />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-4 bg-white/20" />
              <h2 className="text-xs font-sans uppercase tracking-[0.2em] text-white/50 font-medium">
                Próximos Eventos
              </h2>
            </div>
            <span className="text-[10px] font-sans text-white/20 uppercase tracking-wider font-medium">
              {upcomingEvents.length} evento
              {upcomingEvents.length !== 1 ? 's' : ''}
            </span>
          </motion.div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-[#0A0A0A] border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <motion.div
              variants={fadeUp}
              className="flex items-center gap-3 p-5 border border-red-500/15 bg-red-500/5"
            >
              <AlertCircle className="w-4 h-4 text-red-400/70 shrink-0" />
              <p className="text-xs text-red-300/70 font-mono">{error}</p>
            </motion.div>
          ) : upcomingEvents.length === 0 ? (
            <motion.div
              variants={fadeUp}
              className="flex flex-col items-center justify-center py-20 border border-white/5 bg-[#0A0A0A]/50"
            >
              <Calendar
                className="w-8 h-8 text-white/10 mb-4"
                strokeWidth={1}
              />
              <p className="text-sm text-white/25 font-sans">
                Nenhum evento agendado
              </p>
              <p className="text-[10px] text-white/15 font-sans mt-1 uppercase tracking-wider">
                Os próximos eventos aparecerão aqui
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((assignment) => {
                const evt = assignment.event
                if (!evt) return null

                return (
                  <motion.div
                    key={assignment.event_id}
                    variants={fadeUp}
                    className="group bg-[#0A0A0A] border border-white/[0.06] hover:border-white/[0.12]
                               transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-0 h-[1px] bg-gradient-to-r from-white/30 to-transparent group-hover:w-full transition-all duration-500" />

                    <div className="p-5 md:p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-white/90 leading-tight">
                            {evt.title || 'Evento'}
                          </h3>
                          {evt.event_type && (
                            <span className="inline-block text-[9px] font-mono uppercase tracking-[0.15em] text-white/25 border border-white/10 px-2 py-0.5">
                              {evt.event_type}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {evt.event_date && (
                          <div className="flex items-center gap-2.5 text-white/40">
                            <Calendar className="w-3.5 h-3.5 shrink-0 text-white/20" />
                            <span className="text-xs font-mono capitalize">
                              {format(
                                new Date(evt.event_date),
                                'dd MMM, EEEE',
                                { locale: ptBR },
                              )}
                            </span>
                          </div>
                        )}
                        {evt.start_time && (
                          <div className="flex items-center gap-2.5 text-white/40">
                            <Clock className="w-3.5 h-3.5 shrink-0 text-white/20" />
                            <span className="text-xs font-mono">
                              {evt.start_time}
                              {evt.end_time ? ` — ${evt.end_time}` : ''}
                            </span>
                          </div>
                        )}
                        {evt.client?.name && (
                          <div className="flex items-center gap-2.5 text-white/40">
                            <User className="w-3.5 h-3.5 shrink-0 text-white/20" />
                            <span className="text-xs">{evt.client.name}</span>
                          </div>
                        )}
                      </div>

                      {evt.location && (
                        <div className="flex items-center gap-2.5 text-white/30 mt-3 pt-3 border-t border-white/[0.04]">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-white/15" />
                          <span className="text-xs font-mono truncate">
                            {evt.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      <footer className="border-t border-white/[0.03] mt-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
          <span className="text-[9px] font-mono text-white/15 uppercase tracking-[0.2em]">
            Khaos Kontrol
          </span>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-green-500/40 rounded-full animate-pulse" />
            <span className="text-[9px] font-mono text-white/15 uppercase tracking-wider">
              Live
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
