import { useState, useEffect, useCallback } from 'react'
import { addMinutes } from 'date-fns'
import { formatDate } from '@/lib/date-utils'

import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'

import {
  EventFormData,
  EventClient,
  EventProject,
  EventService,
  EventAssistant,
} from './event-form.types'
import { COLORS } from './event-form.constants'

interface UseEventFormProps {
  event: EventFormData | null
  assistants: EventAssistant[]
  selectedDate?: Date
  onSuccess: () => void
}

export function useEventForm({
  event,
  assistants,
  selectedDate,
  onSuccess,
}: UseEventFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<EventClient[]>([])
  const [projects, setProjects] = useState<EventProject[]>([])
  const [services, setServices] = useState<EventService[]>([])

  const [showQuickClient, setShowQuickClient] = useState(false)
  const [showQuickProject, setShowQuickProject] = useState(false)
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventType, setEventType] = useState('noivas')

  const [arrivalTime, setArrivalTime] = useState('')
  const [makingOfTime, setMakingOfTime] = useState('')
  const [ceremonyTime, setCeremonyTime] = useState('')
  const [advisoryTime, setAdvisoryTime] = useState('')

  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [clientId, setClientId] = useState<string>('')
  const [projectId, setProjectId] = useState<string>('')
  const [selectedAssistants, setSelectedAssistants] = useState<string[]>([])
  const [reminderDays, setReminderDays] = useState<number[]>([1, 7])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')

  const isNoivas = eventType === 'noivas'
  const clientName = clients.find((c) => c.id === clientId)?.name
  const filteredProjects = clientId
    ? projects.filter((p) => p.client_id === clientId)
    : projects

  useEffect(() => {
    if (user) {
      fetchClients()
      fetchProjects()
      fetchServices()
    }
  }, [user])

  const resetForm = useCallback(() => {
    setTitle('')
    setDescription('')
    setEventDate(selectedDate ? formatDate(selectedDate, 'yyyy-MM-dd') : '')
    setEventType('noivas')
    setArrivalTime('')
    setMakingOfTime('')
    setCeremonyTime('')
    setAdvisoryTime('')
    setStartTime('')
    setEndTime('')
    setAddress('')
    setLatitude(null)
    setLongitude(null)
    setNotes('')
    setColor(COLORS[0])
    setClientId('')
    setProjectId('')
    setSelectedAssistants([])
    setReminderDays([1, 7])
    setSelectedServiceId('')
  }, [selectedDate])

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description || '')
      setEventDate(event.event_date)
      setEventType(event.event_type || 'noivas')
      setArrivalTime(event.arrival_time || '')
      setMakingOfTime(event.making_of_time || '')
      setCeremonyTime(event.ceremony_time || '')
      setAdvisoryTime(event.advisory_time || '')
      setStartTime(event.start_time || '')
      setEndTime(event.end_time || '')
      setAddress(event.address || '')
      setLatitude(event.latitude ? Number(event.latitude) : null)
      setLongitude(event.longitude ? Number(event.longitude) : null)
      setNotes(event.notes || '')
      setColor(event.color || COLORS[0])
      setClientId(event.client_id || '')
      setProjectId(event.project_id || '')
      setReminderDays(event.reminder_days || [1, 7])
      setSelectedAssistants(event.assistants?.map((a) => a.id) || [])
    } else {
      resetForm()
      if (selectedDate) {
        setEventDate(formatDate(selectedDate, 'yyyy-MM-dd'))
      }
    }
  }, [event, selectedDate, resetForm])

  const fetchClients = async () => {
    const { data } = await supabase
      .from('wedding_clients')
      .select('id, name, phone')
      .order('name')
    if (data) setClients(data)
  }

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('id, name, client_id')
      .order('name')
    if (data) setProjects(data)
  }

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').order('name')
    if (data) {
      setServices(
        data.map((s) => ({
          ...s,
          price: typeof s.price === 'string' ? parseFloat(s.price) : s.price,
          duration_minutes:
            typeof s.duration_minutes === 'string'
              ? parseInt(s.duration_minutes)
              : s.duration_minutes,
        })),
      )
    }
  }

  const toggleAssistant = (assistantId: string) => {
    setSelectedAssistants((prev) =>
      prev.includes(assistantId)
        ? prev.filter((id) => id !== assistantId)
        : [...prev, assistantId],
    )
  }

  const toggleReminder = (days: number) => {
    setReminderDays((prev) =>
      prev.includes(days) ? prev.filter((d) => d !== days) : [...prev, days],
    )
  }

  const handleClientCreated = (client: {
    id: string
    name: string
    phone: string | null
  }) => {
    setClients((prev) =>
      [...prev, client].sort((a, b) => a.name.localeCompare(b.name)),
    )
    setClientId(client.id)
  }

  const handleProjectCreated = (project: {
    id: string
    name: string
    client_id: string
  }) => {
    setProjects((prev) =>
      [...prev, project].sort((a, b) => a.name.localeCompare(b.name)),
    )
    setProjectId(project.id)
    if (!clientId) {
      setClientId(project.client_id)
    }
  }

  const handleConfirmationComplete = () => {
    setShowConfirmation(false)
    setConfirmationMessage('')
  }

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    if (serviceId === '__none__' || !serviceId) return

    const service = services.find((s) => s.id === serviceId)
    if (!service) return

    setTitle(service.name)
    if (service.description) setDescription(service.description)

    if (eventType !== 'noivas' && startTime) {
      const [hours, minutes] = startTime.split(':').map(Number)
      const date = new Date()
      date.setHours(hours, minutes, 0, 0)
      const endDate = addMinutes(date, service.duration_minutes)
      setEndTime(
        `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`,
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, informe o título do evento.',
        variant: 'destructive',
      })
      return
    }
    if (!eventDate) {
      toast({
        title: 'Data obrigatória',
        description: 'Por favor, selecione a data do evento.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    const eventData = {
      user_id: user.id,
      title,
      description: description || null,
      event_date: eventDate,
      event_type: eventType,
      arrival_time: isNoivas ? arrivalTime || null : null,
      making_of_time: isNoivas ? makingOfTime || null : null,
      ceremony_time: isNoivas ? ceremonyTime || null : null,
      advisory_time: isNoivas ? advisoryTime || null : null,
      start_time: !isNoivas ? startTime || null : ceremonyTime || null,
      end_time: !isNoivas ? endTime || null : null,
      address: address || null,
      latitude: latitude !== null ? String(latitude) : null,
      longitude: longitude !== null ? String(longitude) : null,
      notes: notes || null,
      color,
      client_id: clientId || null,
      project_id: projectId || null,
      reminder_days:
        reminderDays.length > 0 ? JSON.stringify(reminderDays) : null,
    }

    try {
      let eventId: string

      if (event) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id!)
        if (error) throw error
        eventId = event.id!

        await supabase
          .from('event_assistants')
          .delete()
          .eq('event_id', event.id!)
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert(eventData)
          .select()
          .maybeSingle()
        if (error) throw error
        eventId = data.id
      }

      if (selectedAssistants.length > 0) {
        const assignments = selectedAssistants.map((assistantId) => ({
          event_id: eventId,
          assistant_id: assistantId,
        }))

        await supabase.from('event_assistants').insert(assignments)

        const notifications = selectedAssistants.map((assistantId) => ({
          user_id: assistantId,
          assistant_id: assistantId,
          event_id: eventId,
          title: `Novo Evento: ${title}`,
          message: `Você foi adicionado ao evento "${title}" em ${formatDate(eventDate, 'dd/MM/yyyy')}`,
          type: 'event_assignment',
          action_link: `/agenda?date=${eventDate}`,
          read: false,
        }))

        await supabase.from('assistant_notifications').insert(notifications)

        const taggedAssistants = assistants.filter((a) =>
          selectedAssistants.includes(a.id),
        )
        if (taggedAssistants.length > 0) {
          setConfirmationMessage(
            `${taggedAssistants.length} assistente${taggedAssistants.length > 1 ? 's' : ''} ${taggedAssistants.length > 1 ? 'foram' : 'foi'} tagged${taggedAssistants.length > 1 ? 's' : ''} com sucesso!`,
          )
          setShowConfirmation(true)
        }
      }

      try {
        const eventDataForSync: Record<string, string | number | null> = {
          title: isNoivas ? `[NOIVA] ${title}` : title,
          description: description || '',
          event_date: eventDate,
          color,
          location: address || '',
        }

        if (isNoivas) {
          eventDataForSync.start_time =
            arrivalTime || makingOfTime || ceremonyTime || '09:00'
        } else {
          eventDataForSync.start_time = startTime || '09:00'
          if (endTime) eventDataForSync.end_time = endTime
        }

        const { error: syncError } = await supabase.functions.invoke(
          'google-calendar-sync',
          {
            body: {
              action: event ? 'update' : 'create',
              event_id: eventId,
              event_data: eventDataForSync,
            },
          },
        )

        if (syncError) {
          toast({
            title: 'Atenção',
            description:
              'Evento salvo, mas houve erro ao sincronizar com Google.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Sincronizado',
            description: 'Evento sincronizado com Google Calendar.',
          })
        }
      } catch (calendarError: unknown) {
        logger.error(
          'Erro na sincronização Google (useEventForm.calendarSync)',
          calendarError,
          'SYSTEM',
          { showToast: false },
        )
      }

      toast({
        title: 'Sucesso',
        description: event
          ? 'Evento atualizado com sucesso!'
          : 'Novo evento criado com vigor!',
      })

      onSuccess()
    } catch (error: unknown) {
      logger.error(
        'Erro ao salvar formulário (useEventForm.handleSubmit)',
        error,
        'SYSTEM',
        { showToast: false },
      )
      toast({
        title: 'Erro',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar o evento',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!event || !user) return

    setLoading(true)
    try {
      if (event.google_calendar_event_id && user) {
        await supabase.functions.invoke('google-calendar-sync', {
          body: { action: 'delete', event_id: event.id },
        })
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id!)
      if (error) throw error

      toast({ title: 'Evento excluído' })
      onSuccess()
    } catch (_error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const openWhatsAppConfirmation = () => {
    if (!clientName || !user) return
    const phone =
      '55' +
      (clients.find((c) => c.id === clientId)?.phone || '').replace(/\D/g, '')
    const dateStr = formatDate(eventDate, 'dd/MM')
    const msg = `Olá ${clientName}! Aqui é a ${user?.user_metadata?.full_name?.split(' ')[0] || 'Profissional'}. Confirmando seu horário de ${title || 'Procedimento'} para ${dateStr} às ${isNoivas ? arrivalTime : startTime}. Podemos confirmar?`
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
      '_blank',
    )
  }

  return {
    loading,
    clients,
    projects,
    services,
    showQuickClient,
    setShowQuickClient,
    showQuickProject,
    setShowQuickProject,
    isAutocompleteOpen,
    setIsAutocompleteOpen,
    title,
    setTitle,
    description,
    setDescription,
    eventDate,
    setEventDate,
    eventType,
    setEventType,
    arrivalTime,
    setArrivalTime,
    makingOfTime,
    setMakingOfTime,
    ceremonyTime,
    setCeremonyTime,
    advisoryTime,
    setAdvisoryTime,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    address,
    setAddress,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    notes,
    setNotes,
    color,
    setColor,
    clientId,
    setClientId,
    projectId,
    setProjectId,
    selectedAssistants,
    reminderDays,
    showConfirmation,
    confirmationMessage,
    selectedServiceId,
    isNoivas,
    clientName,
    filteredProjects,
    user,
    toggleAssistant,
    toggleReminder,
    handleClientCreated,
    handleProjectCreated,
    handleConfirmationComplete,
    handleServiceSelect,
    handleSubmit,
    handleDelete,
    openWhatsAppConfirmation,
  }
}
