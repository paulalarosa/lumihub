import { useState } from 'react'
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

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  initialDate: Date | null
  onSuccess: () => void
}

export const CreateEventModal = ({
  isOpen,
  onClose,
  initialDate,
  onSuccess,
}: CreateEventModalProps) => {
  const { user } = useAuth()
  const { createMutation } = useEventMutations()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: initialDate ? format(initialDate, 'yyyy-MM-dd') : '',
    startTime: '09:00',
    endTime: '12:00',
    location: '',
    eventType: 'wedding' as 'wedding' | 'social' | 'test' | 'blocked',
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      startTime: '09:00',
      endTime: '12:00',
      location: '',
      eventType: 'wedding',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const startDateTime = new Date(
      `${formData.startDate}T${formData.startTime}`,
    )
    const endDateTime = new Date(`${formData.startDate}T${formData.endTime}`)

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

    onSuccess()
    onClose()
    resetForm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 max-w-2xl text-white" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Novo Evento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {}
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

          {}
          <div>
            <Label htmlFor="eventType" className="text-white">
              Tipo de Evento *
            </Label>
            <Select
              value={formData.eventType}
              onValueChange={(value: string) =>
                setFormData({
                  ...formData,
                  eventType: value as 'wedding' | 'social' | 'test' | 'blocked',
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

          {}
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

          {}
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

          {}
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

          {}
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
              disabled={createMutation.isPending}
              className="bg-white text-black hover:bg-neutral-200"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
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
