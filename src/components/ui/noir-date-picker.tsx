import * as React from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface NoirDatePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  className?: string
  placeholder?: string
}

export function NoirDatePicker({
  date,
  setDate,
  className,
  placeholder = 'Selecione uma data',
}: NoirDatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white rounded-none h-12',
            !date && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, 'PPP', { locale: ptBR })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-[#050505] border border-white/20 rounded-none shadow-[0_0_30px_-5px_rgba(0,0,0,0.8)]"
        align="start"
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          locale={ptBR}
          className="p-3 pointer-events-auto bg-[#050505] text-white rounded-none font-mono"
          classNames={{
            caption: 'flex justify-center pt-1 relative items-center',
            caption_label:
              'text-sm font-medium uppercase tracking-widest font-serif text-white',
            nav_button:
              'h-7 w-7 bg-transparent hover:bg-white/10 hover:text-white opacity-50 hover:opacity-100 rounded-none border border-white/10 transition-colors',
            head_cell:
              'text-muted-foreground rounded-none w-9 font-normal text-[0.8rem] uppercase tracking-wider',
            cell: 'h-9 w-9 text-center text-sm p-0 data-[selected]:bg-white data-[selected]:text-black first:[&:has([aria-selected])]:rounded-l-none last:[&:has([aria-selected])]:rounded-r-none focus-within:relative focus-within:z-20 relative [&:has([aria-selected])]:bg-accent',
            day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 hover:text-white rounded-none transition-colors',
            day_selected:
              'bg-white text-black hover:bg-white hover:text-black focus:bg-white focus:text-black',
            day_today: 'bg-white/5 text-white border border-white/20',
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
