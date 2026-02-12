import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  color: string | null;
  event_type: string | null;
  location: string | null;
  client?: { name: string } | null;
}

interface CalendarEventCellProps {
  event: Event;
  variant?: 'compact' | 'detailed' | 'minimal';
  onClick?: (e?: React.MouseEvent) => void;
  onDoubleClick?: (e?: React.MouseEvent) => void;
}

export function CalendarEventCell({
  event,
  variant = 'compact',
  onClick,
  onDoubleClick
}: CalendarEventCellProps) {
  const eventColor = event.color || '#5A7D7C';

  if (variant === 'minimal') {
    return (
      <div
        className="w-2 h-2 rounded-full cursor-pointer hover:scale-125 transition-transform"
        style={{ backgroundColor: eventColor }}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick?.(e);
          }
        }}
        role="button"
        tabIndex={0}
        title={event.title}
      />
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className="group flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity truncate outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        style={{ backgroundColor: `${eventColor}20`, borderLeft: `3px solid ${eventColor}` }}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.(e);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Event: ${event.title}`}
      >
        {event.start_time && (
          <span className="text-muted-foreground font-medium shrink-0">
            {event.start_time.slice(0, 5)}
          </span>
        )}
        <span className="truncate font-medium" style={{ color: eventColor }}>
          {event.title}
        </span>
      </div>
    );
  }

  return (
    <div
      className="group flex flex-col gap-0.5 px-2 py-1.5 rounded-md cursor-pointer hover:shadow-md transition-all outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      style={{ backgroundColor: `${eventColor}15`, borderLeft: `4px solid ${eventColor}` }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Event: ${event.title}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm truncate" style={{ color: eventColor }}>
          {event.title}
        </span>
        {event.start_time && (
          <span className="text-xs text-muted-foreground shrink-0">
            {event.start_time.slice(0, 5)}
            {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
          </span>
        )}
      </div>
      {(event.location || event.client) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {event.client && <span>{event.client.name}</span>}
          {event.location && <span>• {event.location}</span>}
        </div>
      )}
    </div>
  );
}
