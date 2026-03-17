import { format } from 'date-fns/format'
import { ptBR } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { User, Mail, Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Assistant {
  id: string
  name: string
  email: string | null
  phone: string | null
}

import { Event } from '@/hooks/useEvents'

export type CalendarSize = 'small' | 'medium' | 'large'

interface CalendarSidebarProps {
  currentDate: Date
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onMonthChange: (date: Date) => void
  onClearDateFilter?: () => void
  assistants: Assistant[]
  events: Event[]
  calendarSize?: CalendarSize
  onCalendarSizeChange?: (size: CalendarSize) => void
}

export function CalendarSidebar({
  currentDate,
  selectedDate,
  onDateSelect,
  onMonthChange,
  onClearDateFilter,
  assistants,
  events,
  calendarSize = 'small',
  onCalendarSizeChange,
}: CalendarSidebarProps) {
  // Create a map of dates with events for highlighting
  const eventDates = events.reduce(
    (acc, event) => {
      const dateStr = event.event_date
      if (!acc[dateStr]) {
        acc[dateStr] = []
      }
      acc[dateStr].push(event.color || '#FFFFFF')
      return acc
    },
    {} as Record<string, string[]>,
  )

  const handleIncreaseSize = () => {
    if (onCalendarSizeChange) {
      if (calendarSize === 'small') onCalendarSizeChange('medium')
      else if (calendarSize === 'medium') onCalendarSizeChange('large')
    }
  }

  const handleDecreaseSize = () => {
    if (onCalendarSizeChange) {
      if (calendarSize === 'large') onCalendarSizeChange('medium')
      else if (calendarSize === 'medium') onCalendarSizeChange('small')
    }
  }

  const calendarClassName = cn(
    'w-full transition-all duration-200',
    calendarSize === 'medium' &&
      '[&_.rdp-cell]:p-1 [&_.rdp-day]:h-10 [&_.rdp-day]:w-10',
    calendarSize === 'large' &&
      '[&_.rdp-cell]:p-1.5 [&_.rdp-day]:h-12 [&_.rdp-day]:w-12 [&_.rdp-head_cell]:text-sm',
  )

  return (
    <div className="flex flex-col h-full font-mono">
      {/* Mini Calendar */}
      <div className="border border-white/20 rounded-none p-3 bg-black">
        {/* Size controls */}
        {onCalendarSizeChange && (
          <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-2">
            <button
              onClick={onClearDateFilter}
              className="text-sm font-medium text-white hover:text-white/70 uppercase tracking-widest cursor-pointer"
            >
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-none hover:bg-white hover:text-black"
                onClick={handleDecreaseSize}
                disabled={calendarSize === 'small'}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-none hover:bg-white hover:text-black"
                onClick={handleIncreaseSize}
                disabled={calendarSize === 'large'}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        <Calendar
          mode="single"
          selected={selectedDate || undefined}
          onSelect={(date) => date && onDateSelect(date)}
          month={currentDate}
          onMonthChange={onMonthChange}
          locale={ptBR}
          className={calendarClassName}
          classNames={{
            day_selected:
              'bg-white text-black hover:bg-white/90 focus:bg-white focus:text-black rounded-none',
            day_today:
              'bg-transparent border border-white text-white rounded-none',
          }}
          modifiers={{
            hasEvent: (date) => {
              const dateStr = format(date, 'yyyy-MM-dd')
              return !!eventDates[dateStr]
            },
          }}
          modifiersStyles={{
            hasEvent: {
              fontWeight: 'bold',
              textDecoration: 'underline',
              textDecorationColor: '#ffffff',
              textDecorationThickness: '2px',
              textUnderlineOffset: '3px',
            },
          }}
        />
      </div>

      {/* Assistants List */}
      <div className="mt-4 border border-white/20 rounded-none bg-black flex-1 min-h-0">
        <div className="p-3 border-b border-white/20">
          <h3 className="font-mono text-xs uppercase tracking-widest flex items-center gap-2 text-white">
            <User className="h-4 w-4" />
            EQUIPE_PRO
          </h3>
        </div>
        <ScrollArea className="h-[200px]">
          <div className="p-3 space-y-3">
            {assistants.length === 0 ? (
              <p className="text-xs font-mono text-white/40 text-center py-4 uppercase tracking-widest">
                NO_ASSISTANTS_FOUND
              </p>
            ) : (
              assistants.map((assistant) => (
                <div
                  key={assistant.id}
                  className="flex items-start gap-3 p-2 rounded-none border border-transparent hover:border-white/20 hover:bg-white/5 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-none border border-white/20 bg-black flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-colors">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs uppercase truncate text-white">
                      {assistant.name}
                    </p>
                    {assistant.email && (
                      <p className="text-[10px] text-white/50 flex items-center gap-1 truncate font-mono">
                        <Mail className="h-3 w-3 shrink-0" />
                        {assistant.email}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Legend */}
      <div className="mt-4 border border-white/20 rounded-none p-3 bg-black">
        <h3 className="font-mono text-xs uppercase tracking-widest mb-2 text-white">
          EVENT_TYPES
        </h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-white/70">
            <div className="w-2 h-2 rounded-none bg-white" />
            <span>NOIVAS</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-white/70">
            <div className="w-2 h-2 rounded-none border border-white" />
            <span>PRE_WEDDING</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-white/70">
            <div className="w-2 h-2 rounded-none bg-white/40" />
            <span>SOCIAL</span>
          </div>
        </div>
      </div>
    </div>
  )
}
