import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarHeaderProps {
  currentDate: Date;
  onNavigate: (date: Date) => void;
  onToday: () => void;
  onCreateEvent: () => void;
}

export function CalendarHeader({
  currentDate,
  onNavigate,
  onToday,
  onCreateEvent,
}: CalendarHeaderProps) {
  const handlePrevious = () => {
    onNavigate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    onNavigate(addMonths(currentDate, 1));
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={onToday} className="hidden sm:flex">
          Hoje
        </Button>
        <h2 className="text-lg sm:text-xl font-semibold capitalize ml-2">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
      </div>

      <Button onClick={onCreateEvent} className="gap-2">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Novo Evento</span>
      </Button>
    </div>
  );
}
