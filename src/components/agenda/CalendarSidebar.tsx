import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Phone, Mail } from "lucide-react";

interface Assistant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Event {
  id: string;
  event_date: string;
  color: string | null;
}

interface CalendarSidebarProps {
  currentDate: Date;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  assistants: Assistant[];
  events: Event[];
}

export function CalendarSidebar({
  currentDate,
  selectedDate,
  onDateSelect,
  onMonthChange,
  assistants,
  events,
}: CalendarSidebarProps) {
  // Create a map of dates with events for highlighting
  const eventDates = events.reduce((acc, event) => {
    const dateStr = event.event_date;
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(event.color || '#5A7D7C');
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="flex flex-col h-full">
      {/* Mini Calendar */}
      <div className="border rounded-lg p-3 bg-card">
        <Calendar
          mode="single"
          selected={selectedDate || undefined}
          onSelect={(date) => date && onDateSelect(date)}
          month={currentDate}
          onMonthChange={onMonthChange}
          locale={ptBR}
          className="w-full"
          modifiers={{
            hasEvent: (date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              return !!eventDates[dateStr];
            },
          }}
          modifiersStyles={{
            hasEvent: {
              fontWeight: 'bold',
              textDecoration: 'underline',
              textDecorationColor: 'hsl(var(--primary))',
              textDecorationThickness: '2px',
              textUnderlineOffset: '3px',
            },
          }}
        />
      </div>

      {/* Assistants List */}
      <div className="mt-4 border rounded-lg bg-card flex-1 min-h-0">
        <div className="p-3 border-b">
          <h3 className="font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Assistentes
          </h3>
        </div>
        <ScrollArea className="h-[200px]">
          <div className="p-3 space-y-3">
            {assistants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum assistente cadastrado
              </p>
            ) : (
              assistants.map((assistant) => (
                <div
                  key={assistant.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{assistant.name}</p>
                    {assistant.email && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        {assistant.email}
                      </p>
                    )}
                    {assistant.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3 shrink-0" />
                        {assistant.phone}
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
      <div className="mt-4 border rounded-lg p-3 bg-card">
        <h3 className="font-medium text-sm mb-2">Tipos de Evento</h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#5A7D7C' }} />
            <span>Noivas</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#D4A574' }} />
            <span>Pré Wedding</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8B7355' }} />
            <span>Produções Sociais</span>
          </div>
        </div>
      </div>
    </div>
  );
}
