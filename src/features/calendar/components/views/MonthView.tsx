import { useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { CalendarEventCell } from './CalendarEventCell'

interface Event {
  id: string
  title: string
  event_date: string
  start_time: string | null
  end_time: string | null
  color: string | null
  event_type: string | null
  location: string | null
  client?: { name: string } | null
}

interface MonthViewProps {
  currentDate: Date
  events: Event[]
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onEventClick: (event: Event) => void
  onEventDoubleClick: (event: Event) => void
  onCreateEvent: (date: Date) => void
}

export function MonthView({
  currentDate,
  events,
  selectedDate,
  onDateSelect,
  onEventClick,
  onEventDoubleClick,
  onCreateEvent,
}: MonthViewProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { locale: ptBR })
    const calendarEnd = endOfWeek(monthEnd, { locale: ptBR })

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentDate])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>()
    events.forEach((event) => {
      const dateKey = event.event_date
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(event)
    })
    // Sort events by start_time
    map.forEach((dayEvents) => {
      dayEvents.sort((a, b) => {
        if (!a.start_time) return 1
        if (!b.start_time) return -1
        return a.start_time.localeCompare(b.start_time)
      })
    })
    return map
  }, [events])

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="flex flex-col h-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map((day, index) => {
          const dateKey = formatDate(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDate.get(dateKey) || []
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isTodayDate =
            formatDate(day, 'yyyy-MM-dd') ===
            formatDate(new Date(), 'yyyy-MM-dd')
          const maxVisibleEvents = 3

          return (
            <div
              key={index}
              className={cn(
                'min-h-[100px] border-b border-r p-1 cursor-pointer transition-colors',
                !isCurrentMonth && 'bg-muted/30',
                isSelected && 'bg-primary/5',
                'hover:bg-muted/50',
              )}
              onClick={() => onDateSelect(day)}
              onDoubleClick={() => onCreateEvent(day)}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'flex items-center justify-center w-7 h-7 text-sm rounded-full',
                    isTodayDate &&
                      'bg-primary text-primary-foreground font-bold',
                    !isCurrentMonth && 'text-muted-foreground',
                    isSelected && !isTodayDate && 'bg-primary/20',
                  )}
                >
                  {formatDate(day, 'd')}
                </span>
                {dayEvents.length > maxVisibleEvents && (
                  <span className="text-xs text-muted-foreground">
                    +{dayEvents.length - maxVisibleEvents}
                  </span>
                )}
              </div>

              <div className="space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, maxVisibleEvents).map((event) => (
                  <CalendarEventCell
                    key={event.id}
                    event={event}
                    variant="compact"
                    onClick={(e) => {
                      e?.stopPropagation()
                      onEventClick(event)
                    }}
                    onDoubleClick={(e) => {
                      e?.stopPropagation()
                      onEventDoubleClick(event)
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
