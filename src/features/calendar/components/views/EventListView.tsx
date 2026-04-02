import { isSameDay } from 'date-fns'
import { formatDate } from '@/lib/date-utils'

import { CalendarX2 } from 'lucide-react'
import EventCard from '@/features/calendar/components/EventCard'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/ui/empty-state'

import { Event } from '@/hooks/useEvents'

interface EventListViewProps {
  events: Event[]
  selectedDate: Date | null
  currentDate: Date
  onEditEvent: (event: Event) => void
  onDeleteEvent: (eventId: string) => void
}

export function EventListView({
  events,
  selectedDate,
  currentDate,
  onEditEvent,
  onDeleteEvent,
}: EventListViewProps) {
  const filteredEvents = selectedDate
    ? events.filter((event) =>
        isSameDay(new Date(event.event_date + 'T12:00:00'), selectedDate),
      )
    : events

  const groupedEvents = filteredEvents.reduce(
    (acc, event) => {
      const dateStr = event.event_date
      if (!acc[dateStr]) {
        acc[dateStr] = []
      }
      acc[dateStr].push(event)
      return acc
    },
    {} as Record<string, Event[]>,
  )

  const sortedDates = Object.keys(groupedEvents).sort()

  const getHeaderText = () => {
    if (selectedDate) {
      return formatDate(selectedDate, "EEEE, d 'de' MMMM")
    }
    return formatDate(currentDate, "MMMM 'de' yyyy")
  }

  return (
    <div className="flex flex-col h-full">
      {}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold capitalize">
            {getHeaderText()}
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredEvents.length} evento
            {filteredEvents.length !== 1 ? 's' : ''}
          </span>
        </div>
        {selectedDate && (
          <p className="text-xs text-muted-foreground mt-1">
            Clique no título do mês no calendário para ver todos os eventos
          </p>
        )}
      </div>

      {}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {sortedDates.length === 0 ? (
            <EmptyState
              icon={CalendarX2}
              title="Nenhum evento"
              description={
                selectedDate
                  ? 'Não há eventos para esta data'
                  : 'Não há eventos neste mês'
              }
              className="bg-transparent border-none"
            />
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateStr) => (
                <div key={dateStr}>
                  {}
                  {!selectedDate && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {formatDate(dateStr, 'd')}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium uppercase text-muted-foreground">
                            {formatDate(dateStr, 'EEEE')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(dateStr, 'MMMM')}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}

                  {}
                  <div className="space-y-3">
                    {groupedEvents[dateStr].map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEdit={() => onEditEvent(event)}
                        onDelete={() => onDeleteEvent(event.id)}
                        showDate={false}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
