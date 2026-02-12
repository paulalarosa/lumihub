import { useMemo } from "react";
import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, User, Clock } from "lucide-react";

interface Event {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  color: string | null;
  event_type: string | null;
  location: string | null;
  description: string | null;
  client?: { name: string } | null;
  project?: { name: string } | null;
}

interface DayViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onEventDoubleClick: (event: Event) => void;
  onCreateEvent: (date: Date, time?: string) => void;
}

const HOUR_HEIGHT = 80;
const START_HOUR = 6;
const END_HOUR = 22;

export function DayView({
  currentDate,
  events,
  onEventClick,
  onEventDoubleClick,
  onCreateEvent,
}: DayViewProps) {
  const hours = useMemo(() => {
    return Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  }, []);

  const dateKey = format(currentDate, 'yyyy-MM-dd');
  const dayEvents = events.filter((e) => e.event_date === dateKey);
  const timedEvents = dayEvents.filter((e) => e.start_time);
  const allDayEvents = dayEvents.filter((e) => !e.start_time);
  const isTodayDate = isToday(currentDate);

  const getEventPosition = (event: Event) => {
    if (!event.start_time) return null;

    const [hours, minutes] = event.start_time.split(':').map(Number);
    const top = (hours - START_HOUR) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;

    let height = HOUR_HEIGHT;
    if (event.end_time) {
      const [endHours, endMinutes] = event.end_time.split(':').map(Number);
      const endTop = (endHours - START_HOUR) * HOUR_HEIGHT + (endMinutes / 60) * HOUR_HEIGHT;
      height = Math.max(endTop - top, 50);
    }

    return { top, height };
  };

  const handleTimeSlotClick = (hour: number) => {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    onCreateEvent(currentDate, time);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className={cn(
          "py-4 px-6 border-b text-center",
          isTodayDate && "bg-primary/5"
        )}
      >
        <div className="text-sm text-muted-foreground uppercase">
          {format(currentDate, 'EEEE', { locale: ptBR })}
        </div>
        <div
          className={cn(
            "text-3xl font-bold mt-1",
            isTodayDate && "text-primary"
          )}
        >
          {format(currentDate, 'd')}
        </div>
        <div className="text-sm text-muted-foreground">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="border-b p-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase">
            Dia Inteiro
          </div>
          {allDayEvents.map((event) => {
            const eventColor = event.color || '#5A7D7C';
            return (
              <div
                key={event.id}
                className="rounded-md px-3 py-2 cursor-pointer hover:shadow-md transition-shadow"
                style={{
                  backgroundColor: `${eventColor}20`,
                  borderLeft: `4px solid ${eventColor}`,
                }}
                onClick={() => onEventClick(event)}
                onDoubleClick={() => onEventDoubleClick(event)}
              >
                <div className="font-medium" style={{ color: eventColor }}>
                  {event.title}
                </div>
                {event.client && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <User className="h-3 w-3" />
                    {event.client.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <ScrollArea className="flex-1">
        <div className="flex min-h-full">
          {/* Time labels */}
          <div className="w-20 shrink-0 border-r">
            {hours.map((hour) => (
              <div
                key={hour}
                className="text-sm text-muted-foreground text-right pr-3 -mt-2"
                style={{ height: HOUR_HEIGHT }}
              >
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Main column */}
          <div className={cn("flex-1 relative", isTodayDate && "bg-primary/5")}>
            {/* Hour slots */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="border-b hover:bg-muted/30 cursor-pointer transition-colors outline-none focus:bg-muted/50"
                style={{ height: HOUR_HEIGHT }}
                onClick={() => handleTimeSlotClick(hour)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTimeSlotClick(hour);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Select time slot ${hour}:00`}
              >
                {/* Half-hour line */}
                <div className="h-1/2 border-b border-dashed border-muted/50" />
              </div>
            ))}

            {/* Events */}
            {timedEvents.map((event) => {
              const position = getEventPosition(event);
              if (!position) return null;

              const eventColor = event.color || '#5A7D7C';

              return (
                <div
                  key={event.id}
                  className="absolute left-2 right-4 rounded-lg px-3 py-2 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow z-10"
                  style={{
                    top: position.top,
                    height: position.height,
                    backgroundColor: `${eventColor}15`,
                    borderLeft: `4px solid ${eventColor}`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onEventDoubleClick(event);
                  }}
                >
                  <div
                    className="font-semibold text-sm truncate"
                    style={{ color: eventColor }}
                  >
                    {event.title}
                  </div>

                  {position.height > 50 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {event.start_time?.slice(0, 5)}
                      {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                    </div>
                  )}

                  {position.height > 70 && event.client && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <User className="h-3 w-3" />
                      {event.client.name}
                    </div>
                  )}

                  {position.height > 90 && event.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>
                  )}

                  {position.height > 110 && event.description && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {event.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
