import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { toZonedTime, formatDate } from '@/lib/date-utils'

interface Event {
  id: string
  title: string
  event_date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  address?: string | null
  notes: string | null
  client_id: string | null
  project_id: string | null
  client?: { id: string; name: string; phone?: string; email?: string } | null
  assistants?: { id: string; name: string }[]
  event_type?: string | null
  total_value?: number
  updated_at?: string
}

interface Assistant {
  id: string
  name: string
}

interface Client {
  id: string
  name: string
}

export type {
  Event as SidebarEvent,
  Assistant as SidebarAssistant,
  Client as SidebarClient,
}

interface UseEventDetailsSidebarProps {
  open: boolean
  initialEvent: Event | null
  onEdit: (event: Event) => void
  onDelete: (eventId: string) => void
  onOpenChange: (open: boolean) => void
  userRole: 'admin' | 'assistant' | 'viewer'
}

export function useEventDetailsSidebar({
  open,
  initialEvent,
  onEdit,
  onDelete,
  onOpenChange,
  userRole,
}: UseEventDetailsSidebarProps) {
  const { toast } = useToast()
  const isLeader = userRole === 'admin'

  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState<string | null>(null)
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedAssistants, setSelectedAssistants] = useState<string[]>([])
  const [openAssistantCombobox, setOpenAssistantCombobox] = useState(false)
  const [clients] = useState<Client[]>([])
  const [availableAssistants] = useState<Assistant[]>([])
  const [fetchingDetail, setFetchingDetail] = useState(false)
  const [saving, setSaving] = useState(false)

  const resetForm = useCallback(() => {
    setTitle('')
    setClientId(null)
    setEventDate(undefined)
    setStartTime('')
    setEndTime('')
    setLocation('')
    setNotes('')
    setSelectedAssistants([])
  }, [])

  const fetchLists = useCallback(async () => {}, [])

  const fetchEventDetails = useCallback(
    async (id: string) => {
      setFetchingDetail(true)
      try {
        const { data: eventData, error } = await supabase
          .from('events')
          .select(`*, client:wedding_clients(id, name:full_name)`)
          .eq('id', id)
          .maybeSingle()

        if (error) throw error
        if (eventData) {
          setTitle(eventData.title)
          setClientId(eventData.client_id)
          setEventDate(toZonedTime(eventData.event_date))
          setStartTime(eventData.start_time?.slice(0, 5) || '')
          setEndTime(eventData.end_time?.slice(0, 5) || '')
          setLocation(eventData.location || eventData.address || '')
          setNotes(eventData.notes || '')

          const { data: relData } = await supabase
            .from('event_assistants')
            .select('assistant_id')
            .eq('event_id', id)
          if (relData) setSelectedAssistants(relData.map((r) => r.assistant_id))
        }
      } catch (_error) {
        toast({ title: 'Erro ao carregar detalhes', variant: 'destructive' })
      } finally {
        setFetchingDetail(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    if (open) {
      fetchLists()
      if (initialEvent?.id) fetchEventDetails(initialEvent.id)
    } else {
      resetForm()
    }
  }, [open, initialEvent, fetchEventDetails, fetchLists, resetForm])

  const handleSave = async () => {
    if (!initialEvent?.id) return
    setSaving(true)

    try {
      const updates: Partial<Event> = {
        title,
        client_id: clientId,
        event_date: eventDate ? formatDate(eventDate, 'yyyy-MM-dd') : null,
        start_time: startTime ? `${startTime}:00` : null,
        end_time: endTime ? `${endTime}:00` : null,
        location,
        address: location,
        notes,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', initialEvent.id)
      if (error) throw error

      await supabase
        .from('event_assistants')
        .delete()
        .eq('event_id', initialEvent.id)
      if (selectedAssistants.length > 0) {
        const assistantsToInsert = selectedAssistants.map((aid) => ({
          event_id: initialEvent.id,
          assistant_id: aid,
        }))
        const { error: assistError } = await supabase
          .from('event_assistants')
          .insert(assistantsToInsert)
        if (assistError) throw assistError
      }

      toast({
        title: 'Evento atualizado!',
        description: 'As alterações foram salvas com sucesso.',
      })

      onEdit({
        ...initialEvent,
        ...updates,
        assistants: availableAssistants
          .filter((a) => selectedAssistants.includes(a.id))
          .map((a) => ({ id: a.id, name: a.name })),
        client: clientId ? clients.find((c) => c.id === clientId) : null,
      })
      onOpenChange(false)
    } catch (_error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (initialEvent?.id) {
      onDelete(initialEvent.id)
      onOpenChange(false)
    }
  }

  const toggleAssistant = (id: string) => {
    setSelectedAssistants((current) =>
      current.includes(id)
        ? current.filter((aid) => aid !== id)
        : [...current, id],
    )
  }

  return {
    title,
    setTitle,
    clientId,
    setClientId,
    eventDate,
    setEventDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    location,
    setLocation,
    notes,
    setNotes,
    selectedAssistants,
    openAssistantCombobox,
    setOpenAssistantCombobox,
    clients,
    availableAssistants,
    fetchingDetail,
    saving,
    isLeader,
    handleSave,
    handleDelete,
    toggleAssistant,
    resetForm,
    fetchLists,
  }
}
