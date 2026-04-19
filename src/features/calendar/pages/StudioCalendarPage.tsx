import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Clock,
  User,
  Share2,
  Copy,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, parseISO, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useStudioCalendar, useIsStudioMember, StudioEvent } from '@/features/calendar/hooks/useStudioCalendar'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

const COLORS = ['#ffffff', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899']

export default function StudioCalendarPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isStudio = useIsStudioMember()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [showCreate, setShowCreate] = useState(false)
  const [editEvent, setEditEvent] = useState<StudioEvent | null>(null)
  const [showShare, setShowShare] = useState(false)

  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

  const { events, createEvent, updateEvent, deleteEvent } =
    useStudioCalendar(monthStart, monthEnd)

  const sharingLink = useMemo(() => {
    if (!user) return ''
    const weekDate = selectedDate || new Date()
    const weekStartStr = format(startOfWeek(weekDate, { weekStartsOn: 0 }), 'yyyy-MM-dd')
    return `${window.location.origin}/agenda-equipa/${user.id}/disponibilidade?week=${weekStartStr}`
  }, [user, selectedDate])

  const copyLink = () => {
    navigator.clipboard.writeText(sharingLink)
    toast({ title: 'Link copiado!', description: 'Agora você pode compartilhar sua disponibilidade da semana.' })
  }

  const [form, setForm] = useState({

    title: '',
    event_date: '',
    start_time: '09:00',
    end_time: '12:00',
    description: '',
    color: '#ffffff',
  })

  const days = useMemo(

    () =>
      eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
      }),
    [currentMonth],
  )

  const eventsForDate = (date: Date) =>
    events.filter((e) => isSameDay(parseISO(e.event_date), date))

  const selectedEvents = selectedDate ? eventsForDate(selectedDate) : []

  const openCreate = (date?: Date) => {
    setForm({
      title: '',
      event_date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '12:00',
      description: '',
      color: '#ffffff',
    })
    setEditEvent(null)
    setShowCreate(true)
  }

  const openEdit = (event: StudioEvent) => {
    setForm({
      title: event.title,
      event_date: event.event_date,
      start_time: event.start_time.slice(0, 5),
      end_time: event.end_time.slice(0, 5),
      description: event.description || '',
      color: event.color || '#ffffff',
    })
    setEditEvent(event)
    setShowCreate(true)
  }

  const handleSave = () => {
    if (!form.title || !form.event_date || !form.start_time || !form.end_time) return

    if (editEvent) {
      updateEvent.mutate(
        { event_id: editEvent.id, ...form },
        { onSuccess: () => setShowCreate(false) },
      )
    } else {
      createEvent.mutate(form, { onSuccess: () => setShowCreate(false) })
    }
  }

  if (!isStudio) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Calendar className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest text-center">
          Acesso restrito a membros do Studio
        </p>
        <p className="text-muted-foreground/60 text-sm text-center max-w-sm">
          Solicite a tag Studio ao administrador para acessar o calendário compartilhado.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-foreground font-serif text-2xl md:text-3xl tracking-tight">
            Studio Kaos
          </h1>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mt-1">
            Calendário Compartilhado
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-none border-white/10"
            onClick={() => setShowShare(true)}
          >
            <Share2 className="h-3 w-3 mr-2" />
            Compartilhar Semana
          </Button>
          <Button
            size="sm"
            className="rounded-none font-bold"
            onClick={() => openCreate()}
          >
            <Plus className="h-3 w-3 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card className="lg:col-span-2 bg-background border border-border rounded-none">
          <CardHeader className="border-b border-border flex flex-row items-center justify-between py-3 px-4">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none h-8 w-8 p-0"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="font-serif text-lg capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none h-8 w-8 p-0"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-2 md:p-4">

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div
                  key={d}
                  className="text-center font-mono text-[10px] text-muted-foreground uppercase tracking-widest py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">

              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map(
                (_, i) => (
                  <div key={`empty-${i}`} className="h-16 md:h-20" />
                ),
              )}

              {days.map((day) => {
                const dayEvents = eventsForDate(day)
                const isSelected =
                  selectedDate && isSameDay(day, selectedDate)

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`h-16 md:h-20 border p-1 text-left transition-colors relative ${
                      isSelected
                        ? 'border-foreground bg-muted/50'
                        : 'border-border/50 hover:border-border hover:bg-muted/20'
                    } ${isToday(day) ? 'bg-muted/30' : ''}`}
                  >
                    <span
                      className={`font-mono text-[11px] ${
                        isToday(day)
                          ? 'text-foreground font-bold'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <div
                          key={e.id}
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: e.color || '#fff' }}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[8px] text-muted-foreground">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background border border-border rounded-none">
          <CardHeader className="border-b border-border py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-base">
                {selectedDate
                  ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                  : 'Selecione um dia'}
              </CardTitle>
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-none h-7 w-7 p-0"
                  onClick={() => openCreate(selectedDate)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedDate ? (
              <div className="p-8 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-muted-foreground font-mono text-xs">
                  Clique em um dia
                </p>
              </div>
            ) : selectedEvents.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground font-mono text-xs mb-3">
                  Sem eventos neste dia
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none"
                  onClick={() => openCreate(selectedDate)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {selectedEvents.map((e) => (
                  <div
                    key={e.id}
                    className="px-4 py-3 hover:bg-muted/20 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                       <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: e.color || '#fff' }}
                        />
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-foreground font-medium truncate">
                            {e.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {e.start_time.slice(0, 5)} — {e.end_time.slice(0, 5)}
                            </span>
                          </div>
                          {e.creator_name && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="font-mono text-[10px] text-muted-foreground truncate">
                                {e.creator_name}
                              </span>
                            </div>
                          )}
                          {e.description && (
                            <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-2">
                              {e.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-none"
                          onClick={() => openEdit(e)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        {(e.created_by === user?.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 rounded-none text-destructive"
                            onClick={() => deleteEvent.mutate(e.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-background border-border rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              {editEvent ? 'Editar Evento' : 'Novo Evento no Studio'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">
                Título
              </label>
              <Input
                className="rounded-none border-border"
                placeholder="Ex: Atendimento manhã"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">
                Data
              </label>
              <Input
                type="date"
                className="rounded-none border-border"
                value={form.event_date}
                onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Início
                </label>
                <Input
                  type="time"
                  className="rounded-none border-border"
                  value={form.start_time}
                  onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Fim
                </label>
                <Input
                  type="time"
                  className="rounded-none border-border"
                  value={form.end_time}
                  onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">
                Cor
              </label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      form.color === c ? 'border-foreground scale-110' : 'border-border'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">
                Descrição (opcional)
              </label>
              <Textarea
                className="rounded-none border-border font-mono text-xs min-h-[80px]"
                placeholder="Detalhes do evento..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-none"
              onClick={() => setShowCreate(false)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-none"
              onClick={handleSave}
              disabled={
                !form.title || !form.event_date || createEvent.isPending || updateEvent.isPending
              }
            >
              {createEvent.isPending || updateEvent.isPending
                ? 'Salvando...'
                : editEvent
                  ? 'Salvar'
                  : 'Criar Evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="bg-background border-border rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              Compartilhar Agenda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-xs text-muted-foreground font-sans">
              Este link permite que interessados vejam seus horários disponíveis para a semana de{' '}
              <span className="text-foreground font-bold font-mono">
                {selectedDate ? format(startOfWeek(selectedDate, { weekStartsOn: 0 }), 'dd/MM', { locale: ptBR }) : ''}
              </span>.
            </p>

            <div className="flex gap-2">
              <Input
                readOnly
                value={sharingLink}
                className="rounded-none border-border bg-muted/30 font-mono text-[10px]"
              />
              <Button size="sm" className="rounded-none px-3" onClick={copyLink}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            <div className="p-4 border border-blue-500/20 bg-blue-500/5 space-y-2">
              <div className="flex items-center gap-2 text-blue-400">
                <Share2 className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold font-mono uppercase tracking-widest">Dica Premium</span>
              </div>
              <p className="text-[10px] text-blue-300/80 leading-relaxed font-sans">
                Seus eventos privados não são mostrados. O interessado verá apenas se o horário está "Livre" ou "Ocupado".
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="rounded-none w-full"
              onClick={() => setShowShare(false)}
            >
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
