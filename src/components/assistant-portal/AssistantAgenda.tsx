import { useState } from "react";
import { format, parseISO, isSameMonth, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, ExternalLink, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address: string | null;
  event_type: string | null;
  description: string | null;
  clients?: { name: string } | null;
  projects?: { name: string } | null;
}

interface AssistantAgendaProps {
  events: Event[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

type CalendarSize = "small" | "medium" | "large";

const AssistantAgenda = ({ events, currentMonth, onMonthChange }: AssistantAgendaProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarSize, setCalendarSize] = useState<CalendarSize>("small");

  const filteredEvents = selectedDate
    ? events.filter((e) => isSameDay(parseISO(e.event_date), selectedDate))
    : events;

  const eventDates = events.map((e) => parseISO(e.event_date));

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      if (selectedDate && isSameDay(date, selectedDate)) {
        setSelectedDate(null);
      } else {
        setSelectedDate(date);
      }
    }
  };

  const openInMaps = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
  };

  const calendarSizeClasses = {
    small: "scale-90 origin-top-left",
    medium: "scale-100",
    large: "scale-110 origin-top-left",
  };

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const dateKey = event.event_date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Agenda</h2>
        <p className="text-muted-foreground">
          Seus eventos atribuídos
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Calendar Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Calendário</CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCalendarSize(calendarSize === "small" ? "small" : calendarSize === "medium" ? "small" : "medium")}
                    disabled={calendarSize === "small"}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCalendarSize(calendarSize === "large" ? "large" : calendarSize === "medium" ? "large" : "medium")}
                    disabled={calendarSize === "large"}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium text-sm">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className={cn("overflow-hidden", calendarSizeClasses[calendarSize])}>
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={handleDateSelect}
                  month={currentMonth}
                  onMonthChange={onMonthChange}
                  modifiers={{ hasEvent: eventDates }}
                  modifiersStyles={{
                    hasEvent: { fontWeight: "bold", textDecoration: "underline", textUnderlineOffset: "2px" }
                  }}
                  className="pointer-events-auto"
                />
              </div>
            </CardContent>
          </Card>

          {selectedDate && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setSelectedDate(null)}
            >
              Mostrar todos do mês
            </Button>
          )}
        </div>

        {/* Events List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {selectedDate
                ? `Eventos de ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`
                : `Eventos de ${format(currentMonth, "MMMM yyyy", { locale: ptBR })}`}
            </h3>
            <Badge variant="secondary">
              {filteredEvents.length} {filteredEvents.length === 1 ? "evento" : "eventos"}
            </Badge>
          </div>

          {sortedDates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum evento encontrado para este período
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateKey) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {format(parseISO(dateKey), "dd")}
                    </div>
                    <div>
                      <p className="font-medium">
                        {format(parseISO(dateKey), "EEEE", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(dateKey), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pl-10">
                    {groupedEvents[dateKey].map((event) => (
                      <Card key={event.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold truncate">{event.title}</h4>
                                {event.event_type && (
                                  <Badge variant="outline" className="shrink-0">
                                    {event.event_type}
                                  </Badge>
                                )}
                              </div>

                              {event.clients?.name && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  Cliente: {event.clients.name}
                                </p>
                              )}

                              {event.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {event.description}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-4 text-sm">
                                {event.start_time && (
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    {event.start_time}
                                    {event.end_time && ` - ${event.end_time}`}
                                  </span>
                                )}

                                {(event.location || event.address) && (
                                  <button
                                    onClick={() => openInMaps(event.address || event.location || "")}
                                    className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                                  >
                                    <MapPin className="h-4 w-4" />
                                    <span className="truncate max-w-[200px]">
                                      {event.location || event.address}
                                    </span>
                                    <ExternalLink className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssistantAgenda;
