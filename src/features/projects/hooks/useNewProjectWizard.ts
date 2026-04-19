import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export type WizardStep = 0 | 1 | 2 | 3

export interface ClientOption {
  id: string
  full_name: string
  email: string | null
  phone: string | null
}

export interface WizardState {

  clientMode: 'select' | 'create'
  clientId: string
  newClientName: string
  newClientEmail: string
  newClientPhone: string

  projectName: string
  eventType: string
  budget: string
  notes: string

  eventDate: string
  eventTime: string
  eventLocation: string
  createCalendarEvent: boolean

  sendWelcomeEmail: boolean
}

const EVENT_TYPES = [
  'Casamento',
  'Noivas',
  'Pré Wedding',
  'Debutante',
  'Formatura',
  'Ensaio Fotográfico',
  'Evento Corporativo',
  'Festa',
  'Outro',
]

export { EVENT_TYPES }

const initialState: WizardState = {
  clientMode: 'select',
  clientId: '',
  newClientName: '',
  newClientEmail: '',
  newClientPhone: '',
  projectName: '',
  eventType: '',
  budget: '',
  notes: '',
  eventDate: '',
  eventTime: '',
  eventLocation: '',
  createCalendarEvent: false,
  sendWelcomeEmail: true,
}

export interface WizardOptions {
  onSuccess?: () => void
  defaultClientMode?: 'select' | 'create'
}

export function useNewProjectWizard(options?: WizardOptions | (() => void)) {
  const onSuccess = typeof options === 'function' ? options : options?.onSuccess
  const defaultClientMode = typeof options === 'object' && options !== null && !(options instanceof Function)
    ? options.defaultClientMode
    : undefined
  const { user } = useAuth()
  const { organizationId } = useOrganization()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<WizardStep>(0)
  const [state, setState] = useState<WizardState>(initialState)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [loadingClients, setLoadingClients] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const update = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState(prev => ({ ...prev, [key]: value }))
  }, [])

  const loadClients = useCallback(async () => {
    if (!user) return
    setLoadingClients(true)
    const { data } = await supabase
      .from('wedding_clients')
      .select('id, full_name, email, phone')
      .eq('user_id', organizationId || user.id)
      .order('full_name')
    setClients((data as ClientOption[]) || [])
    setLoadingClients(false)
  }, [user, organizationId])

  const openWizard = useCallback((preselectedClientId?: string, mode?: 'select' | 'create') => {
    const resolvedMode = mode ?? defaultClientMode ?? 'select'
    setState({
      ...initialState,
      clientId: preselectedClientId || '',
      clientMode: preselectedClientId ? 'select' : resolvedMode,
    })
    setStep(0)
    setClientSearch('')
    loadClients()
    setOpen(true)
  }, [loadClients, defaultClientMode])

  const closeWizard = useCallback(() => {
    setOpen(false)
    setStep(0)
    setState(initialState)
    setClientSearch('')
  }, [])

  const filteredClients = clients.filter(c =>
    c.full_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(clientSearch.toLowerCase()),
  )

  const selectedClient = clients.find(c => c.id === state.clientId)

  const autoSuggestName = useCallback(() => {
    if (!state.projectName && state.clientId && state.eventType) {
      const client = clients.find(c => c.id === state.clientId)
      if (client) {
        update('projectName', `${state.eventType} — ${client.full_name}`)
      }
    }
  }, [state.projectName, state.clientId, state.eventType, clients, update])

  const canProceedStep0 = state.clientMode === 'select'
    ? !!state.clientId
    : !!state.newClientName.trim()

  const canProceedStep1 = !!state.projectName.trim() && !!state.eventType

  const canProceedStep2 = !!state.eventDate

  const goNext = useCallback(() => {
    if (step === 0 && !canProceedStep0) return
    if (step === 1 && !canProceedStep1) return
    if (step === 2 && !canProceedStep2) return
    setStep(prev => Math.min(prev + 1, 3) as WizardStep)
  }, [step, canProceedStep0, canProceedStep1, canProceedStep2])

  const goBack = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 0) as WizardStep)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!user) return
    setSubmitting(true)

    try {
      const orgId = organizationId || user.id

      let finalClientId = state.clientId

      if (state.clientMode === 'create') {
        const { data: newClient, error: clientError } = await supabase
          .from('wedding_clients')
          .insert({
            full_name: state.newClientName.trim(),
            email: state.newClientEmail.trim() || null,
            phone: state.newClientPhone.trim() || null,
            user_id: orgId,
          })
          .select('id')
          .single()

        if (clientError) throw new Error('Erro ao criar cliente: ' + clientError.message)
        finalClientId = newClient.id
        queryClient.invalidateQueries({ queryKey: ['wedding_clients_list'] })
        queryClient.invalidateQueries({ queryKey: ['clients'] })
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: state.projectName.trim(),
          client_id: finalClientId,
          event_type: state.eventType,
          event_date: state.eventDate || null,
          event_time: state.eventTime || null,
          event_location: state.eventLocation.trim() || null,
          total_budget: state.budget ? parseFloat(state.budget) : null,
          notes: state.notes.trim() || null,
          status: 'active',
          user_id: orgId,
        })
        .select()
        .single()

      if (projectError) throw new Error('Erro ao criar projeto: ' + projectError.message)

      if (state.createCalendarEvent && state.eventDate) {
        await supabase.from('events').insert({
          title: state.projectName.trim(),
          client_id: finalClientId,
          project_id: project.id,
          event_type: state.eventType,
          event_date: state.eventDate,
          start_time: state.eventTime || null,
          location: state.eventLocation.trim() || null,
          user_id: orgId,
          status: 'confirmed',
        })
      }

      if (state.sendWelcomeEmail) {
        const clientEmail = state.clientMode === 'create'
          ? state.newClientEmail
          : selectedClient?.email

        if (clientEmail) {
          supabase.functions.invoke('send-welcome-email', {
            body: { clientId: finalClientId, projectName: state.projectName.trim() },
          })
        }
      }

      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Projeto criado com sucesso!')
      closeWizard()
      onSuccess?.()
      navigate(`/projetos/${project.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar projeto'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }, [user, organizationId, state, selectedClient, queryClient, closeWizard, navigate, onSuccess])

  return {
    open,
    step,
    state,
    update,
    clients,
    filteredClients,
    selectedClient,
    clientSearch,
    setClientSearch,
    loadingClients,
    submitting,
    openWizard,
    closeWizard,
    goNext,
    goBack,
    handleSubmit,
    autoSuggestName,
    canProceedStep0,
    canProceedStep1,
    canProceedStep2,
    EVENT_TYPES,
  }
}
