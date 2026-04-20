import { useState, useEffect, useMemo } from 'react'
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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, UserPlus } from 'lucide-react'
import { format } from 'date-fns/format'
import { logger } from '@/services/logger'
import { toast } from 'sonner'

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

interface ClientOption {
  id: string
  name: string | null
  full_name: string | null
}

type ClientMode = 'none' | 'existing' | 'new'

export const CreateEventModal = ({
  isOpen,
  onClose,
  initialDate,
  onSuccess,
  event,
}: CreateEventModalProps) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { createMutation, updateMutation } = useEventMutations()

  const isEditing = !!event

  const [formData, setFormData] = useState(() => ({
    ...EMPTY_FORM,
    startDate: initialDate ? format(initialDate, 'yyyy-MM-dd') : '',
  }))

  // Client linking: lets the user tie the event to an existing client or
  // create a new one inline. Only relevant when creating (not editing).
  const [clientMode, setClientMode] = useState<ClientMode>('none')
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')

  const { data: clients = [] } = useQuery({
    queryKey: ['event-modal-clients', user?.id],
    queryFn: async (): Promise<ClientOption[]> => {
      if (!user?.id) return []
      const { data } = await supabase
        .from('wedding_clients')
        .select('id, name, full_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      return (data ?? []) as ClientOption[]
    },
    enabled: !!user?.id && isOpen && !isEditing,
  })

  const sortedClients = useMemo(
    () =>
      [...clients].sort((a, b) => {
        const an = (a.full_name ?? a.name ?? '').toLowerCase()
        const bn = (b.full_name ?? b.name ?? '').toLowerCase()
        return an.localeCompare(bn)
      }),
    [clients],
  )

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
    // Reset client linking every time the modal opens for a different context
    setClientMode('none')
    setSelectedClientId('')
    setNewClientName('')
    setNewClientPhone('')
  }, [isOpen, initialDate, event])

  // Optionally creates a wedding_client and returns its id. Falls back to
  // null on failure so the event still gets created — we never block event
  // creation on client insertion.
  const ensureClientId = async (): Promise<string | null> => {
    if (clientMode === 'existing' && selectedClientId) {
      return selectedClientId
    }
    if (clientMode === 'new' && newClientName.trim() && user?.id) {
      try {
        const { data, error } = await supabase
          .from('wedding_clients')
          .insert({
            user_id: user.id,
            name: newClientName.trim(),
            full_name: newClientName.trim(),
            phone: newClientPhone.trim() || null,
            wedding_date: formData.startDate || null,
          })
          .select('id')
          .single()
        if (error) throw error
        queryClient.invalidateQueries({ queryKey: ['clients'] })
        queryClient.invalidateQueries({ queryKey: ['wedding-clients'] })
        queryClient.invalidateQueries({
          queryKey: ['dashboard-clients-count'],
        })
        toast.success(`${newClientName.trim()} cadastrada`)
        return data.id
      } catch (err) {
        logger.error(err, 'CreateEventModal.createClient')
        toast.error(
          'Não conseguimos cadastrar a cliente, mas o evento foi salvo.',
        )
        return null
      }
    }
    return null
  }

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
      const clientId = await ensureClientId()
      await createMutation.mutateAsync({
        user_id: user?.id,
        title: formData.title,
        description: formData.description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: formData.location,
        event_type: formData.eventType,
        status: 'confirmed',
        ...(clientId ? { client_id: clientId } : {}),
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

          {!isEditing && (
            <div className="border-t border-neutral-800 pt-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-white/60" />
                  Cliente
                </Label>
                <div
                  className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest"
                  role="radiogroup"
                  aria-label="Vincular cliente"
                >
                  {(
                    [
                      { v: 'none', l: 'Sem cliente' },
                      { v: 'existing', l: 'Existente' },
                      { v: 'new', l: 'Nova' },
                    ] as { v: ClientMode; l: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      role="radio"
                      aria-checked={clientMode === opt.v}
                      onClick={() => setClientMode(opt.v)}
                      className={`px-3 py-1 border transition-colors ${
                        clientMode === opt.v
                          ? 'border-white bg-white text-black'
                          : 'border-neutral-700 text-white/60 hover:text-white hover:border-neutral-500'
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {clientMode === 'existing' && (
                <Select
                  value={selectedClientId || '__none__'}
                  onValueChange={(v) =>
                    setSelectedClientId(v === '__none__' ? '' : v)
                  }
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Selecione uma cliente..." />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700 text-white max-h-64">
                    <SelectItem value="__none__">—</SelectItem>
                    {sortedClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name ?? c.name ?? 'Sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {clientMode === 'new' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label
                      htmlFor="newClientName"
                      className="text-white/70 text-xs"
                    >
                      Nome da cliente *
                    </Label>
                    <Input
                      id="newClientName"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Ex: Ana Silva"
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="newClientPhone"
                      className="text-white/70 text-xs"
                    >
                      WhatsApp (opcional)
                    </Label>
                    <Input
                      id="newClientPhone"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <p className="sm:col-span-2 text-[10px] text-white/40 font-mono">
                    A cliente será cadastrada automaticamente e vinculada ao
                    evento. Você encontra ela depois em /clientes.
                  </p>
                </div>
              )}
            </div>
          )}

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
