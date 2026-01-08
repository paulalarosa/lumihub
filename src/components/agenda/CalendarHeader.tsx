import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type ViewMode = 'month' | 'week' | 'day';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNavigate: (date: Date) => void;
  onToday: () => void;
  onCreateEvent: () => void;
}

export function CalendarHeader({
  currentDate,
  viewMode,
  onViewModeChange,
  onNavigate,
  onToday,
  onCreateEvent,
}: CalendarHeaderProps) {
  const handlePrevious = () => {
    switch (viewMode) {
      case 'month':
        onNavigate(subMonths(currentDate, 1));
        break;
      case 'week':
        onNavigate(subWeeks(currentDate, 1));
        break;
      case 'day':
        onNavigate(subDays(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case 'month':
        onNavigate(addMonths(currentDate, 1));
        break;
      case 'week':
        onNavigate(addWeeks(currentDate, 1));
        break;
      case 'day':
        onNavigate(addDays(currentDate, 1));
        break;
    }
  };

  const getTitle = () => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
      case 'week':
        return format(currentDate, "'Semana de' d 'de' MMMM", { locale: ptBR });
      case 'day':
        return format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });
    }
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
          {getTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
          className="border rounded-lg"
        >
          <ToggleGroupItem value="month" aria-label="Visualização Mensal" className="px-3">
            Mês
          </ToggleGroupItem>
          <ToggleGroupItem value="week" aria-label="Visualização Semanal" className="px-3">
            Semana
          </ToggleGroupItem>
          <ToggleGroupItem value="day" aria-label="Visualização Diária" className="px-3">
            Dia
          </ToggleGroupItem>
        </ToggleGroup>

        <Button onClick={onCreateEvent} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Evento</span>
        </Button>
      </div>
    </div>
  );
}
