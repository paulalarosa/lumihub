import React, { memo, useRef } from 'react'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns/format'

import { ptBR } from 'date-fns/locale'
import { useVirtualizer } from '@tanstack/react-virtual'

interface Event {
  id: string
  title: string
  start_time: string
  category: string
}

interface EventsTableProps {
  events: Event[]
}

const EventRow = memo(({ event }: { event: Event }) => (
  <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border/50">
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
      <Calendar className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-medium truncate">{event.title}</h4>
      <p className="text-sm text-muted-foreground">
        {format(new Date(event.start_time), "EEEE, d 'de' MMMM", {
          locale: ptBR,
        })}
      </p>
    </div>
    <div className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary">
      {event.category}
    </div>
  </div>
))

EventRow.displayName = 'EventRow'

export const EventsTable: React.FC<EventsTableProps> = ({ events }) => {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  })

  return (
    <div
      ref={parentRef}
      className="max-h-[400px] overflow-auto pr-2 custom-scrollbar"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum evento programado
          </div>
        ) : (
          rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: '8px',
              }}
            >
              <EventRow event={events[virtualRow.index]} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
