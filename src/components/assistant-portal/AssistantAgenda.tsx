import { useState } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, ExternalLink, Minus, Plus, CalendarDays } from "lucide-react";
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-serif text-white uppercase tracking-widest flex items-center gap-2">
          <CalendarDays className="h-5 w-5" /> Mission_Timeline
        </h2>
        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono mt-1">
          /// SCHEDULED_OPERATIONS
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Calendar Sidebar */}
        <div className="space-y-4">
          <Card className="bg-black border border-white/20 rounded-none">
            <CardHeader className="pb-2 border-b border-white/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono text-white uppercase tracking-widest">NAVIGATOR</CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-none text-white/50 hover:text-white"
                    onClick={() => setCalendarSize(calendarSize === "small" ? "small" : calendarSize === "medium" ? "small" : "medium")}
                    disabled={calendarSize === "small"}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-none text-white/50 hover:text-white"
                    onClick={() => setCalendarSize(calendarSize === "large" ? "large" : calendarSize === "medium" ? "large" : "medium")}
                    disabled={calendarSize === "large"}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4 pt-4">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none text-white hover:bg-white hover:text-black" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-mono text-xs text-white uppercase tracking-widest">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none text-white hover:bg-white hover:text-black" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className={cn("overflow-hidden invert text-white", calendarSizeClasses[calendarSize])}>
                {/* Invert filter is a hack to make standard shadcn calendar dark mode compatible if it isn't already, but assuming global styles handle it. 
                     Better to rely on global styles. Removing invert check if global css handles it. 
                     Actually, forcing dark theme classes on Calendar container might be safer. */}
                <div className="calendar-container-noir">
                  <Calendar
                    mode="single"
                    selected={selectedDate || undefined}
                    onSelect={handleDateSelect}
                    month={currentMonth}
                    onMonthChange={onMonthChange}
                    modifiers={{ hasEvent: eventDates }}
                    modifiersStyles={{
                      hasEvent: { fontWeight: "bold", border: "1px solid currentColor", borderRadius: "0px" }
                    }}
                    className="pointer-events-auto text-white p-0"
                    classNames={{
                      day_selected: "bg-white text-black hover:bg-white hover:text-black focus:bg-white focus:text-black rounded-none",
                      day_today: "bg-white/20 text-white rounded-none",
                      day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-white/20 rounded-none transition-colors",
                      head_cell: "text-muted-foreground rounded-none w-8 font-normal text-[0.8rem]",
                      cell: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedDate && (
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest"
              onClick={() => setSelectedDate(null)}
            >
              CLEAR_FILTER
            </Button>
          )}
        </div>

        {/* Events List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/20 pb-2">
            <h3 className="font-mono text-sm text-white uppercase tracking-wider">
              {selectedDate
                ? `DATE: ${format(selectedDate, "dd.MM.yyyy")}`
                : `MONTH: ${format(currentMonth, "MM.yyyy")}`}
            </h3>
            <Badge variant="outline" className="rounded-none border-white/20 text-white/50 font-mono text-[10px] uppercase">
              COUNT: {filteredEvents.length}
            </Badge>
          </div>

          {sortedDates.length === 0 ? (
            <div className="border border-white/10 bg-white/5 border-dashed p-12 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto text-white/20 mb-4" />
              <p className="text-white/40 font-mono text-xs uppercase tracking-widest">
                NO_OPERATIONS_SCHEDULED
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedDates.map((dateKey) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 bg-white flex items-center justify-center text-sm font-bold text-black font-mono rounded-none">
                      {format(parseISO(dateKey), "dd")}
                    </div>
                    <div>
                      <p className="font-serif text-white uppercase tracking-wider">
                        {format(parseISO(dateKey), "EEEE", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pl-11">
                    {groupedEvents[dateKey].map((event) => (
                      <Card key={event.id} className="bg-black border border-white/20 rounded-none hover:border-white transition-colors group">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-white uppercase tracking-wide truncate">{event.title}</h4>
                                {event.event_type && (
                                  <Badge variant="outline" className="shrink-0 rounded-none border-white/30 text-white/50 text-[9px] uppercase font-mono tracking-widest">
                                    {event.event_type}
                                  </Badge>
                                )}
                              </div>

                              {event.clients?.name && (
                                <p className="text-xs text-white/60 mb-3 font-mono uppercase tracking-wide">
                                  CLIENT: {event.clients.name}
                                </p>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono text-white/50">
                                {event.start_time && (
                                  <span className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    {event.start_time} - {event.end_time || "?"}
                                  </span>
                                )}

                                {(event.location || event.address) && (
                                  <button
                                    onClick={() => openInMaps(event.address || event.location || "")}
                                    className="flex items-center gap-2 hover:text-white transition-colors text-left"
                                  >
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate max-w-[200px]">
                                      {event.location || event.address}
                                    </span>
                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
