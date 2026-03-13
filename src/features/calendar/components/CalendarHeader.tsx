import { format } from 'date-fns/format'
import { addMonths } from 'date-fns/addMonths'
import { subMonths } from 'date-fns/subMonths'
import { ptBR } from 'date-fns/locale/pt-BR'

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/hooks/useLanguage'

interface CalendarHeaderProps {
  currentDate: Date
  onNavigate: (date: Date) => void
  onToday: () => void
  onCreateEvent: () => void
}

export function CalendarHeader({
  currentDate,
  onNavigate,
  onToday,
  onCreateEvent,
}: CalendarHeaderProps) {
  const { t } = useLanguage()

  const handlePrevious = () => {
    onNavigate(subMonths(currentDate, 1))
  }

  const handleNext = () => {
    onNavigate(addMonths(currentDate, 1))
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/20">
      <div className="flex items-center gap-2">
        <div className="flex items-center border border-white/20">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="rounded-none hover:bg-white hover:text-black w-8 h-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="w-[1px] h-4 bg-white/20"></div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="rounded-none hover:bg-white hover:text-black w-8 h-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={onToday}
          className="hidden sm:flex rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest h-8"
        >
          HOJE
        </Button>

        <h2 className="text-lg sm:text-xl font-serif uppercase tracking-wider ml-4 text-white">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
      </div>

      <Button
        onClick={onCreateEvent}
        className="gap-2 rounded-none bg-white text-black hover:bg-white/90 font-mono text-xs uppercase tracking-widest h-10 border border-white"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">{t('btn_new_event')}</span>
      </Button>
    </div>
  )
}
