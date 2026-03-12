import { formatDate, toZonedTime } from '@/lib/date-utils'
// format removed (handled by formatDate)
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Bell,
  Users,
  Palette,
  MessageCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { QuickCreateClientDialog } from './QuickCreateClientDialog'
import { QuickCreateProjectDialog } from './QuickCreateProjectDialog'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'
import ConfirmationNotification from '@/features/portal/components/ConfirmationNotification'
import { NoirDatePicker } from '@/components/ui/noir-date-picker'
import { EventTypeSelector } from './EventTypeSelector'
import { EventServiceSelector } from './EventServiceSelector'
import { useEventForm } from './hooks/useEventForm'
import { EventFormData, EventAssistant } from './hooks/event-form.types'
import { COLORS } from './hooks/event-form.constants'

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: EventFormData | null
  assistants: EventAssistant[]
  selectedDate?: Date
  onSuccess: () => void
}

export default function EventDialog({
  open,
  onOpenChange,
  event,
  assistants,
  selectedDate,
  onSuccess,
}: EventDialogProps) {
  const form = useEventForm({ event, assistants, selectedDate, onSuccess })

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (!open && form.isAutocompleteOpen) return
          onOpenChange(open)
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-none shadow-2xl shadow-white/5 sm:max-w-[700px]"
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement
            if (target.closest('.pac-container')) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl font-light text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">
              {event ? 'Editar Evento' : 'Novo Evento'}
            </DialogTitle>
            <DialogDescription className="text-gray-400 font-mono text-xs uppercase tracking-wider">
              Preencha os dados abaixo para{' '}
              {event ? 'atualizar o' : 'agendar um novo'} compromisso.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit} className="space-y-6 mt-4">
            {/* Event Type Pills */}
            <EventTypeSelector
              currentType={form.eventType}
              onTypeChange={form.setEventType}
            />

            {/* Service Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EventServiceSelector
                selectedServiceId={form.selectedServiceId}
                onServiceSelect={form.handleServiceSelect}
                services={form.services}
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-300">
                Título do Evento *
              </Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => form.setTitle(e.target.value)}
                placeholder={
                  form.isNoivas
                    ? 'Ex: Casamento Ana Silva'
                    : 'Ex: Ensaio Pré Wedding'
                }
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/50 focus:ring-1 focus:ring-white/50 rounded-none py-6"
              />
            </div>

            {/* Date & Client Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="eventDate"
                  className="flex items-center gap-2 text-gray-300"
                >
                  <CalendarIcon className="h-4 w-4 text-white" />
                  Data *
                </Label>
                <NoirDatePicker
                  date={
                    form.eventDate ? toZonedTime(form.eventDate) : undefined
                  }
                  setDate={(date) => {
                    if (date) {
                      form.setEventDate(formatDate(date, 'yyyy-MM-dd'))
                    } else {
                      form.setEventDate('')
                    }
                  }}
                  placeholder="Selecione a data"
                />
              </div>

              {/* Client Select */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Cliente</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => form.setShowQuickClient(true)}
                    className="h-6 text-[10px] text-cyan-400 hover:text-cyan-300 px-2"
                  >
                    + NOVO
                  </Button>
                </div>
                <Select
                  value={form.clientId || '__none__'}
                  onValueChange={(v) =>
                    form.setClientId(v === '__none__' ? '' : v)
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-none">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {form.clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => form.setDescription(e.target.value)}
                placeholder="Detalhes adicionais..."
                rows={2}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-none resize-none"
              />
            </div>

            {/* Conditional Times */}
            <div className="p-4 rounded-none bg-white/[0.03] border border-white/5 space-y-4">
              <Label className="flex items-center gap-2 text-white font-medium">
                <Clock className="h-4 w-4" />
                Cronograma
              </Label>
              {form.isNoivas ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="arrivalTime"
                      className="text-xs text-gray-400 block mb-1"
                    >
                      Chegada
                    </Label>
                    <Input
                      id="arrivalTime"
                      type="time"
                      value={form.arrivalTime}
                      onChange={(e) => form.setArrivalTime(e.target.value)}
                      className="bg-black/20 border-white/5 text-white text-sm h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="makingOfTime"
                      className="text-xs text-gray-400 block mb-1"
                    >
                      Making Of
                    </Label>
                    <Input
                      id="makingOfTime"
                      type="time"
                      value={form.makingOfTime}
                      onChange={(e) => form.setMakingOfTime(e.target.value)}
                      className="bg-black/20 border-white/5 text-white text-sm h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="ceremonyTime"
                      className="text-xs text-gray-400 block mb-1"
                    >
                      Cerimônia
                    </Label>
                    <Input
                      id="ceremonyTime"
                      type="time"
                      value={form.ceremonyTime}
                      onChange={(e) => form.setCeremonyTime(e.target.value)}
                      className="bg-black/20 border-white/5 text-white text-sm h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="advisoryTime"
                      className="text-xs text-gray-400 block mb-1"
                    >
                      Assessoria
                    </Label>
                    <Input
                      id="advisoryTime"
                      type="time"
                      value={form.advisoryTime}
                      onChange={(e) => form.setAdvisoryTime(e.target.value)}
                      className="bg-black/20 border-white/5 text-white text-sm h-9"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="startTime"
                      className="text-xs text-gray-400"
                    >
                      Início
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={form.startTime}
                      onChange={(e) => form.setStartTime(e.target.value)}
                      className="bg-black/20 border-white/5 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-xs text-gray-400">
                      Término
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={form.endTime}
                      onChange={(e) => form.setEndTime(e.target.value)}
                      className="bg-black/20 border-white/5 text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-300">
                <MapPin className="h-4 w-4 text-white" />
                Localização
              </Label>
              <div
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  // Allow typing in input but stop propagation for div wrapper
                  e.stopPropagation()
                }}
                role="none"
              >
                <AddressAutocomplete
                  value={form.address}
                  onChange={form.setAddress}
                  onCoordinatesChange={(lat, lng) => {
                    form.setLatitude(lat)
                    form.setLongitude(lng)
                  }}
                  onFocus={() => form.setIsAutocompleteOpen(true)}
                  onBlur={() => form.setIsAutocompleteOpen(false)}
                  placeholder="Digite o endereço completo..."
                  latitude={form.latitude}
                  longitude={form.longitude}
                  className="w-full"
                />
              </div>
            </div>

            {/* Project & Reminders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Projeto / Pasta</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => form.setShowQuickProject(true)}
                    className="h-6 text-[10px] text-cyan-400 hover:text-cyan-300 px-2"
                    disabled={form.clients.length === 0}
                  >
                    + NOVO
                  </Button>
                </div>
                <Select
                  value={form.projectId || '__none__'}
                  onValueChange={(v) =>
                    form.setProjectId(v === '__none__' ? '' : v)
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {form.filteredProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-300">
                  <Bell className="h-4 w-4 text-white" />
                  Lembretes
                </Label>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="reminder1"
                      checked={form.reminderDays.includes(1)}
                      onCheckedChange={() => form.toggleReminder(1)}
                      className="border-zinc-600 data-[state=checked]:bg-zinc-100 data-[state=checked]:text-black"
                    />
                    <Label
                      htmlFor="reminder1"
                      className="text-gray-400 font-normal"
                    >
                      1 dia
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="reminder7"
                      checked={form.reminderDays.includes(7)}
                      onCheckedChange={() => form.toggleReminder(7)}
                      className="border-zinc-600 data-[state=checked]:bg-zinc-100 data-[state=checked]:text-black"
                    />
                    <Label
                      htmlFor="reminder7"
                      className="text-gray-400 font-normal"
                    >
                      1 semana
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Assistants */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-gray-300">
                <Users className="h-4 w-4 text-white" />
                Assistentes
              </Label>
              {assistants.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  {assistants.map((assistant) => {
                    const isSelected = form.selectedAssistants.includes(
                      assistant.id,
                    )
                    return (
                      <button
                        key={assistant.id}
                        type="button"
                        onClick={() => form.toggleAssistant(assistant.id)}
                        className={`
                          flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all border
                          ${
                            isSelected
                              ? 'bg-white/20 text-white border-white/40'
                              : 'bg-black/30 text-gray-500 border-transparent hover:bg-black/50 hover:text-gray-300'
                          }
                        `}
                      >
                        {isSelected && <Users className="h-3 w-3" />}
                        {assistant.name}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-600 italic">
                  Nenhuma assistente disponível.
                </p>
              )}
            </div>

            {/* Color Palette */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <Label className="flex items-center gap-2 text-gray-300 text-xs uppercase tracking-wide">
                <Palette className="h-3 w-3" />
                Cor da Etiqueta
              </Label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => form.setColor(c)}
                    className={`w-6 h-6 rounded-full transition-all hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-offset-black ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
              {event && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={form.handleDelete}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                >
                  Excluir
                </Button>
              )}

              {event && form.clientName && (
                <Button
                  type="button"
                  onClick={form.openWhatsAppConfirmation}
                  className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Confirmar no WhatsApp
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/10 hover:bg-white/5 text-white/70"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.loading}
                className="bg-zinc-100 hover:bg-zinc-200 text-black font-medium min-w-[120px] border border-transparent"
              >
                {form.loading ? 'Salvando...' : 'Salvar Agendamento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <QuickCreateClientDialog
        open={form.showQuickClient}
        onOpenChange={form.setShowQuickClient}
        onSuccess={form.handleClientCreated}
      />

      <QuickCreateProjectDialog
        open={form.showQuickProject}
        onOpenChange={form.setShowQuickProject}
        onSuccess={form.handleProjectCreated}
        preselectedClientId={form.clientId}
        clients={form.clients}
      />

      <ConfirmationNotification
        message={form.confirmationMessage}
        isVisible={form.showConfirmation}
        onComplete={form.handleConfirmationComplete}
      />
    </>
  )
}
