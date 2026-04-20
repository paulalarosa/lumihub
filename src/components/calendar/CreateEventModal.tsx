import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { useEventMutations } from '@/features/calendar/hooks/useEventMutations'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns/format'

type EventType = 'wedding' | 'social' | 'test' | 'blocked'

const EVENT_TYPES: EventType[] = ['wedding', 'social', 'test', 'blocked']

interface EditableEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    eventType: string
    description?: string
    location?: string
  }
}

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  initialDate: Date | null
  onSuccess: () => void
  /** When provided, the modal switches to edit mode and updates this event. */
  event?: EditableEvent | null
}

const EMPTY_FORM = {
  title: '',
  description: '',
  startDate: '',
  startTime: '09:00',
  endTime: '12:00',
  location: '',
  eventType: 'wedding' as EventType,
}

function toEventType(raw: string | undefined): EventType {
  if (raw && (EVENT_TYPES as string[]).includes(raw)) {
    return raw as EventType
  }
  return 'wedding'
}

export const CreateEventModal = ({
  isOpen,
  onClose,
  initialDate,
  onSuccess,
  event,
}: CreateEventModalProps) => {
  const { user } = useAuth()
  const { createMutation, updateMutation } = useEventMutations()

  const isEditing = !!event

  const [formData, setFormData] = useState(() => ({
    ...EMPTY_FORM,
    startDate: initialDate ? format(initialDate, 'yyyy-MM-dd') : '',
  }))

  // Sync form when opening for a new slot OR switching target event.
  useEffect(() => {
    if (!isOpen) return

    if (event) {
      setFormData({
        title: event.title,
        description: event.resource.description ?? '',
        startDate: format(event.start, 'yyyy-MM-dd'),
        startTime: format(event.start, 'HH:mm'),
        endTime: format(event.end, 'HH:mm'),
        location: event.resource.location ?? '',
        eventType: toEventType(event.resource.eventType),
      })
    } else if (initialDate) {
      setFormData({
        ...EMPTY_FORM,
        startDate: format(initialDate, 'yyyy-MM-dd'),
      })
    } else {
      setFormData(EMPTY_FORM)
    }
  }, [isOpen, initialDate, event])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const startDateTime = new Date(
      `${formData.startDate}T${formData.startTime}`,
    )
    const endDateTime = new Date(`${formData.startDate}T${formData.endTime}`)

    if (isEditing && event) {
      await updateMutation.mutateAsync({
        id: event.id,
        data: {
          title: formData.title,
          description: formData.description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          location: formData.location,
          event_type: formData.eventType,
        },
      })
    } else {
      await createMutation.mutateAsync({
        user_id: user?.id,
        title: formData.title,
        description: formData.description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: formData.location,
        event_type: formData.eventType,
        status: 'confirmed',
      })
    }

    onSuccess()
    onClose()
  }

  const pending = isEditing ? updateMutation.isPending : createMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-neutral-900 border-neutral-800 max-w-2xl text-white"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">
            {isEditing ? 'Editar Evento' : 'Novo Evento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-white">
              Título *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Casamento da Maria"
              required
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="eventType" className="text-white">
              Tipo de Evento *
            </Label>
            <Select
              value={formData.eventType}
              onValueChange={(value: string) =>
                setFormData({
                  ...formData,
                  eventType: toEventType(value),
                })
              }
            >
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                <SelectItem value="wedding">Noiva</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="test">Teste</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-white">
                Data *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="startTime" className="text-white">
                Início *
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                required
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="endTime" className="text-white">
                Fim *
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                required
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location" className="text-white">
              Local
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Ex: Salão de Festas ABC"
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-white">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detalhes do evento..."
              rows={3}
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-neutral-700 text-white hover:bg-neutral-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-white text-black hover:bg-neutral-200"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Salvando...' : 'Criando...'}
                </>
              ) : isEditing ? (
                'Salvar alterações'
              ) : (
                'Criar Evento'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
