import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarX2 } from 'lucide-react';
import EventCard from '@/components/agenda/EventCard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type?: string | null;
  start_time: string | null;
  end_time: string | null;
  arrival_time?: string | null;
  making_of_time?: string | null;
  ceremony_time?: string | null;
  advisory_time?: string | null;
  location: string | null;
  address?: string | null;
  color: string;
  client?: { name: string } | null;
  project?: { name: string } | null;
  assistants?: { id: string; name: string }[];
}

interface EventListViewProps {
  events: Event[];
  selectedDate: Date | null;
  currentDate: Date;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
}

export function EventListView({
  events,
  selectedDate,
  currentDate,
  onEditEvent,
  onDeleteEvent,
}: EventListViewProps) {
  // Filter events based on selected date or show all month events
  const filteredEvents = selectedDate
    ? events.filter(event => isSameDay(parseISO(event.event_date), selectedDate))
    : events;

  // Group events by date
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const dateStr = event.event_date;
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  // Sort dates
  const sortedDates = Object.keys(groupedEvents).sort();

  const getHeaderText = () => {
    if (selectedDate) {
      return format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });
    }
    return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold capitalize">
            {getHeaderText()}
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''}
          </span>
        </div>
        {selectedDate && (
          <p className="text-xs text-muted-foreground mt-1">
            Clique no título do mês no calendário para ver todos os eventos
          </p>
        )}
      </div>

      {/* Events List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {sortedDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CalendarX2 className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum evento</p>
              <p className="text-sm">
                {selectedDate
                  ? 'Não há eventos para esta data'
                  : 'Não há eventos neste mês'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map(dateStr => (
                <div key={dateStr}>
                  {/* Date header - only show if not filtering by single date */}
                  {!selectedDate && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {format(parseISO(dateStr), 'd')}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium uppercase text-muted-foreground">
                            {format(parseISO(dateStr), 'EEEE', { locale: ptBR })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(dateStr), 'MMMM', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}

                  {/* Events for this date */}
                  <div className="space-y-3">
                    {groupedEvents[dateStr].map(event => (
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
  );
}
