import { useMemo } from 'react'
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

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

interface WeekViewProps {
  currentDate: Date
  events: Event[]
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onEventClick: (event: Event) => void
  onEventDoubleClick: (event: Event) => void
  onCreateEvent: (date: Date, time?: string) => void
}

const HOUR_HEIGHT = 60 // pixels per hour
const START_HOUR = 6
const END_HOUR = 22

export function WeekView({
  currentDate,
  events,
  selectedDate,
  onDateSelect,
  onEventClick,
  onEventDoubleClick,
  onCreateEvent,
}: WeekViewProps) {
  const days = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { locale: ptBR })
    const weekEnd = endOfWeek(currentDate, { locale: ptBR })
    return eachDayOfInterval({ start: weekStart, end: weekEnd })
  }, [currentDate])

  const hours = useMemo(() => {
    return Array.from(
      { length: END_HOUR - START_HOUR + 1 },
      (_, i) => START_HOUR + i,
    )
  }, [])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>()
    events.forEach((event) => {
      const dateKey = event.event_date
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(event)
    })
    return map
  }, [events])

  const getEventPosition = (event: Event) => {
    if (!event.start_time) return null

    const [hours, minutes] = event.start_time.split(':').map(Number)
    const top =
      (hours - START_HOUR) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT

    let height = HOUR_HEIGHT // default 1 hour
    if (event.end_time) {
      const [endHours, endMinutes] = event.end_time.split(':').map(Number)
      const endTop =
        (endHours - START_HOUR) * HOUR_HEIGHT + (endMinutes / 60) * HOUR_HEIGHT
      height = Math.max(endTop - top, 30) // minimum 30px
    }

    return { top, height }
  }

  const handleTimeSlotClick = (day: Date, hour: number) => {
    const time = `${hour.toString().padStart(2, '0')}:00`
    onCreateEvent(day, time)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with day names */}
      <div className="flex border-b sticky top-0 bg-background z-10">
        <div className="w-16 shrink-0 border-r" /> {/* Time column spacer */}
        {days.map((day) => {
          const isTodayDate =
            formatDate(day, 'yyyy-MM-dd') ===
            formatDate(new Date(), 'yyyy-MM-dd')
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'flex-1 py-3 text-center border-r cursor-pointer hover:bg-muted/50',
                isSelected && 'bg-primary/5',
              )}
              onClick={() => onDateSelect(day)}
            >
              <div className="text-xs text-muted-foreground uppercase">
                {formatDate(day, 'EEE')}
              </div>
              <div
                className={cn(
                  'text-lg font-medium mt-0.5',
                  isTodayDate && 'text-primary',
                )}
              >
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-8 h-8 rounded-full',
                    isTodayDate && 'bg-primary text-primary-foreground',
                  )}
                >
                  {formatDate(day, 'd')}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <ScrollArea className="flex-1">
        <div className="flex min-h-full">
          {/* Time labels */}
          <div className="w-16 shrink-0 border-r">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[60px] text-xs text-muted-foreground text-right pr-2 pt-0 -mt-2"
                style={{ height: HOUR_HEIGHT }}
              >
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dateKey = formatDate(day, 'yyyy-MM-dd')
            const dayEvents = eventsByDate.get(dateKey) || []
            const isTodayDate =
              formatDate(day, 'yyyy-MM-dd') ===
              formatDate(new Date(), 'yyyy-MM-dd')

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'flex-1 border-r relative',
                  isTodayDate && 'bg-primary/5',
                )}
              >
                {/* Hour slots */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="border-b hover:bg-muted/30 cursor-pointer"
                    style={{ height: HOUR_HEIGHT }}
                    onClick={() => handleTimeSlotClick(day, hour)}
                  />
                ))}

                {/* Events */}
                {dayEvents.map((event) => {
                  const position = getEventPosition(event)
                  if (!position) return null

                  const eventColor = event.color || '#5A7D7C'

                  return (
                    <div
                      key={event.id}
                      className="absolute left-1 right-1 rounded-md px-2 py-1 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow z-10"
                      style={{
                        top: position.top,
                        height: position.height,
                        backgroundColor: `${eventColor}20`,
                        borderLeft: `3px solid ${eventColor}`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        onEventDoubleClick(event)
                      }}
                    >
                      <div
                        className="font-medium text-xs truncate"
                        style={{ color: eventColor }}
                      >
                        {event.title}
                      </div>
                      {position.height > 40 && event.start_time && (
                        <div className="text-xs text-muted-foreground">
                          {event.start_time.slice(0, 5)}
                          {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                        </div>
                      )}
                      {position.height > 60 && event.client && (
                        <div className="text-xs text-muted-foreground truncate">
                          {event.client.name}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* All-day events without time */}
                {dayEvents
                  .filter((e) => !e.start_time)
                  .map((event, idx) => {
                    const eventColor = event.color || '#5A7D7C'
                    return (
                      <div
                        key={event.id}
                        className="absolute left-1 right-1 rounded-md px-2 py-0.5 text-xs font-medium truncate cursor-pointer"
                        style={{
                          top: -30 - idx * 24,
                          backgroundColor: eventColor,
                          color: '#fff',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick(event)
                        }}
                      >
                        {event.title}
                      </div>
                    )
                  })}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
