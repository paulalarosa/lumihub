import { User, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Event {
  title: string
  date: string
  client?: string
  type?: string
}

interface EventsTableProps {
  events: Event[]
}

export const EventsTable = ({ events }: EventsTableProps) => {
  return (
    <div className="bg-zinc-950/50 border border-white/10 rounded-none overflow-hidden backdrop-blur-sm">
      <div className="p-3 border-b border-white/5 bg-white/5">
        <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white font-bold">
          Protocol Schedule
        </h4>
      </div>

      <div className="divide-y divide-white/5">
        {events.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-[10px] font-mono uppercase text-zinc-600">
              No events detected in stream
            </p>
          </div>
        ) : (
          events.map((event, idx) => (
            <div
              key={idx}
              className="p-3 hover:bg-white/5 transition-colors group"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[11px] font-bold text-white font-mono group-hover:text-emerald-400 transition-colors uppercase">
                  {event.title}
                </span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 border border-zinc-800 bg-black text-[8px] font-mono uppercase text-zinc-500">
                  {event.type || 'Social'}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {format(new Date(event.date), 'dd MMM, HH:mm', {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                {event.client && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-zinc-500" />
                    <span className="text-[10px] text-zinc-400 font-mono italic">
                      {event.client}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
