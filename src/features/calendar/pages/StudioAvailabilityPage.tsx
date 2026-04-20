import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { format, startOfWeek, addDays, parseISO, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import { PageLoader } from '@/components/ui/page-loader'
import { Button } from '@/components/ui/button'

interface StudioEvent {
  id: string
  event_date: string
  start_time: string
  end_time: string
}

export default function StudioAvailabilityPage() {
  const { professionalId } = useParams<{ professionalId: string }>()
  const [searchParams] = useSearchParams()
  const weekParam = searchParams.get('week')

  const baseDate = useMemo(() => {
    if (weekParam) {
      try {
        return parseISO(weekParam)
      } catch (_e) {
        return new Date()
      }
    }
    return new Date()
  }, [weekParam])

  const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

  const { data: professional, isLoading: loadingProf } = useQuery({
    queryKey: ['professional-profile', professionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, id')
        .eq('id', professionalId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!professionalId,
  })

  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ['studio-availability', professionalId, weekParam],
    queryFn: async () => {
      const startDate = format(weekStart, 'yyyy-MM-dd')
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('studio_events')
        .select('id, event_date, start_time, end_time')
        .eq('created_by', professionalId)
        .gte('event_date', startDate)
        .lte('event_date', endDate)

      if (error) throw error
      return (data as StudioEvent[]) || []
    },
    enabled: !!professionalId,
  })

  const timeSlots = Array.from({ length: 13 }).map((_, i) => ({
    hour: 8 + i,
    label: `${(8 + i).toString().padStart(2, '0')}:00`,
  }))

  const isSlotOccupied = (day: Date, hour: number) => {
    return events?.some((ev) => {
      if (!isSameDay(parseISO(ev.event_date), day)) return false
      if (!ev.start_time || !ev.end_time) return false
      const startH = parseInt(ev.start_time.split(':')[0])
      const endH = parseInt(ev.end_time.split(':')[0])
      return hour >= startH && hour < endH
    })
  }

  if (loadingProf || loadingEvents) return <PageLoader />

  if (!professional) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-zinc-800 mx-auto" />
          <h1 className="text-xl font-serif">Profissional não encontrado</h1>
          <p className="text-sm text-zinc-500 font-mono uppercase tracking-widest">
            Link inválido ou expirado
          </p>
        </div>
      </div>
    )
  }

  const professionalFirstName = professional.full_name
    ? professional.full_name.split(' ')[0]
    : 'Profissional'

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-white selection:text-black font-sans pb-20">
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-white/10 bg-white/[0.03] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white/40" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight uppercase">
                Disponibilidade Studio
              </h1>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mt-0.5">
                {professional.full_name || 'Profissional'}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 border border-white/5 bg-white/[0.02]">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Live Updates</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-serif tracking-tight mb-2">
            Agenda Semanal
          </h2>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.3em]">
            {format(weekStart, "dd 'de' MMM", { locale: ptBR })} — {format(addDays(weekStart, 6), "dd 'de' MMM", { locale: ptBR })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day, i) => (
            <div key={i} className="space-y-4">
              <div className="text-center p-3 border border-white/5 bg-white/[0.02]">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">
                  {format(day, 'EEEE', { locale: ptBR })}
                </p>
                <p className="text-lg font-serif">
                  {format(day, 'dd')}
                </p>
              </div>

              <div className="space-y-2">
                {timeSlots.map((slot) => {
                  const occupied = isSlotOccupied(day, slot.hour)
                  return (
                    <div
                      key={slot.label}
                      className={`p-3 border transition-all duration-300 flex flex-col items-center justify-center gap-1
                        ${occupied
                          ? 'border-zinc-900 bg-zinc-900/10 text-zinc-700 opacity-40 grayscale'
                          : 'border-white/5 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.03] text-white/70'
                        }`}
                    >
                      <span className="text-[10px] font-mono">{slot.label}</span>
                      <span className={`text-[8px] font-bold uppercase tracking-widest ${occupied ? '' : 'text-green-500/50'}`}>
                        {occupied ? 'Ocupado' : 'Livre'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 p-8 border border-white/5 bg-white/[0.01] text-center max-w-2xl mx-auto">
          <CheckCircle className="w-8 h-8 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-serif mb-2">Gostou de algum horário?</h3>
          <p className="text-sm text-zinc-500 mb-6 font-sans">
            Entre em contato diretamente para confirmar sua reserva no Studio.
          </p>
          <Button className="rounded-none bg-white text-black hover:bg-zinc-200 px-8 uppercase text-xs font-bold tracking-widest h-11">
            Falar com {professionalFirstName}
          </Button>
        </div>
      </main>

      <footer className="mt-auto py-10 border-t border-white/5 text-center">
        <p className="text-[9px] font-mono text-white/10 uppercase tracking-[0.4em]">
          Khaos Kontrol System — Powering Modern Professionals
        </p>
      </footer>
    </div>
  )
}

