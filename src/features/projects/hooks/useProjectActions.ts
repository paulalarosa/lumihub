import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useOrganization } from '@/hooks/useOrganization'
import { useAuth } from '@/hooks/useAuth'
import { ProjectService } from '../api/projectService'

import { generateWhatsAppLink } from '@/utils/whatsappGenerator'
import { format } from 'date-fns/format'
import type {
  Task,
  ProjectServiceItem,
  ProjectWithRelations,
  ServiceUI,
} from '@/types/api.types'
import { getErrorMessage } from '@/utils/error-handler'
import { useProjectMutations } from './useProjectMutations'

interface UseProjectActionsProps {
  projectId: string | undefined
  project: ProjectWithRelations | null
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  services: ServiceUI[]
  projectServices: ProjectServiceItem[]
  refetch: () => void
}

export function useProjectActions({
  projectId,
  project,
  tasks,
  setTasks,
  services,
  projectServices,
  refetch,
}: UseProjectActionsProps) {
  const { user } = useAuth()
  const { organizationId } = useOrganization()
  const { toast } = useToast()

  const {
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    addServiceMutation,
    removeServiceMutation,
    registerPaymentMutation,
  } = useProjectMutations()

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [copied, setCopied] = useState(false)

  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [serviceQuantity, setServiceQuantity] = useState('1')
  const [servicePrice, setServicePrice] = useState('')

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentServiceId, setPaymentServiceId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDescription, setPaymentDescription] = useState('')

  const addTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newTaskTitle.trim() || !projectId || !organizationId) return

    try {
      await createTaskMutation.mutateAsync({
        project_id: projectId,
        user_id: organizationId,
        title: newTaskTitle.trim(),
        status: 'pending',
        sort_order: tasks.length,
      })
      setNewTaskTitle('')
      refetch()
    } catch (_error) {}
  }

  const toggleTask = async (taskId: string, currentStatus: string | null) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        project_id: projectId || '',
        data: { status: newStatus },
      })
      setTasks(
        tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
      )
    } catch (_error) {}
  }

  const deleteTask = async (taskId: string) => {
    if (!projectId) return
    try {
      await deleteTaskMutation.mutateAsync({
        id: taskId,
        project_id: projectId,
      })
      setTasks(tasks.filter((t) => t.id !== taskId))
    } catch (_error) {}
  }

  const copyPortalLink = async () => {
    if (!project?.client?.id) {
      toast({
        title: 'Erro',
        description: 'Cliente não vinculado ao projeto.',
        variant: 'destructive',
      })
      return
    }

    try {
      const clientId = project.client.id
      const { data: clientData, error } = await supabase
        .from('wedding_clients')
        .select('access_pin, secret_code')
        .eq('id', clientId)
        .single()

      if (error || !clientData) {
        throw new Error('Cliente não encontrado.')
      }

      if (!clientData.secret_code) {
        throw new Error('Cliente sem código de acesso gerado.')
      }

      const { secret_code } = clientData
      const link = `${window.location.origin}/portal/${secret_code}`
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast({
        title: 'Link Copiado!',
        description: 'Link enviado para a área de transferência.',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      const { title, description } = getErrorMessage(
        error,
        'Erro ao gerar link',
      )
      toast({ title, description, variant: 'destructive' })
    }
  }

  const handleSendReminder = async () => {
    if (!project || !project.client || !user) return

    if (!project.client.phone) {
      toast({
        title: 'Cliente sem telefone cadastrado',
        variant: 'destructive',
      })
      return
    }

    try {
      const { data: templateData } = await supabase
        .from('message_templates')
        .select('content')
        .eq('organization_id', organizationId)
        .eq('type', 'reminder_24h')
        .single()

      const textPattern =
        templateData?.content ||
        'Olá {client_name}, passando para lembrar do seu agendamento dia {date} às {time}.'

      let professionalName = 'Khaos Kontrol'
      const { data: profData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profData?.full_name) professionalName = profData.full_name

      const eventDateObj = project.event_date
        ? new Date(project.event_date)
        : null
      const dateStr = eventDateObj
        ? format(eventDateObj, 'dd/MM')
        : 'Data a definir'
      const timeStr = eventDateObj
        ? format(eventDateObj, 'HH:mm')
        : 'Horário a definir'

      const link = generateWhatsAppLink(textPattern, {
        client_name: project.client.full_name || 'Cliente',
        professional_name: professionalName,
        date: dateStr,
        time: timeStr,
        location: project.event_location || 'Local a definir',
        phone: project.client.phone,
      })

      window.open(link, '_blank')
    } catch (error) {
      const { title, description } = getErrorMessage(
        error,
        'Erro ao gerar link',
      )
      toast({ title, description, variant: 'destructive' })
    }
  }

  const createDefaultBriefing = async () => {
    if (!projectId || !organizationId) return

    const defaultQuestions = [
      {
        id: '1',
        question: 'Qual é o seu tipo de pele? (oleosa, seca, mista, normal)',
        type: 'text',
      },
      {
        id: '2',
        question: 'Você tem alguma alergia a cosméticos?',
        type: 'text',
      },
      {
        id: '3',
        question: 'Qual estilo de maquiagem você prefere?',
        type: 'text',
      },
      { id: '4', question: 'Quais cores você gostaria de usar?', type: 'text' },
      { id: '5', question: 'Você usará cílios postiços?', type: 'text' },
      { id: '6', question: 'Alguma observação adicional?', type: 'text' },
    ]

    const { error } = await ProjectService.createBriefing({
      project_id: projectId,
      status: 'pending',
      user_id: organizationId,
      content: { questions: defaultQuestions },
    })

    if (!error) {
      toast({ title: 'Questionário criado!' })
      refetch()
    }
  }

  const addServiceToProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedServiceId || !projectId || !organizationId) return

    const service = services.find((s) => s.id === selectedServiceId)
    if (!service) return

    const qty = parseInt(serviceQuantity) || 1
    const priceStr = service.price ? String(service.price) : '0'
    const price = servicePrice ? parseFloat(servicePrice) : parseFloat(priceStr)
    const total = qty * price

    try {
      await addServiceMutation.mutateAsync({
        project_id: projectId,
        service_id: selectedServiceId,
        quantity: qty.toString(),
        unit_price: price,
        total_price: total.toString(),
      })
      setIsServiceDialogOpen(false)
      setSelectedServiceId('')
      setServiceQuantity('1')
      setServicePrice('')
      refetch()
    } catch (_error) {}
  }

  const removeServiceFromProject = async (projectServiceId: string) => {
    if (!projectId) return
    try {
      await removeServiceMutation.mutateAsync({
        id: projectServiceId,
        project_id: projectId,
      })
      refetch()
    } catch (_error) {}
  }

  const registerPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanAmount =
      typeof paymentAmount === 'string'
        ? parseFloat(
            paymentAmount.replace('R$', '').replace('.', '').replace(',', '.'),
          )
        : parseFloat(paymentAmount)

    if (isNaN(cleanAmount)) {
      toast({ title: 'Valor inválido', variant: 'destructive' })
      return
    }

    if (
      !projectId ||
      (!project?.client_id && !project?.client?.id) ||
      !organizationId
    ) {
      toast({
        title: 'Erro interno',
        description: 'Identificação do projeto ou usuário ausente.',
        variant: 'destructive',
      })
      return
    }

    const ps = projectServices.find((s) => s.id === paymentServiceId)
    const finalDescription =
      paymentDescription.trim() ||
      (ps ? `Pagamento: ${ps.service?.name}` : 'Pagamento Geral')

    const payload = {
      project_id: projectId,
      client_id: project.client_id || project.client?.id,
      amount: cleanAmount,
      description: finalDescription,
      type: 'income',
      status: 'completed',
      user_id: organizationId,
      date: new Date().toISOString(),
      category: 'Projeto',
    }

    try {
      await registerPaymentMutation.mutateAsync(payload)
      setIsPaymentDialogOpen(false)
      setPaymentServiceId('')
      setPaymentAmount('')
      setPaymentDescription('')
      refetch()
    } catch (_error) {}
  }

  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    const service = services.find((s) => s.id === serviceId)
    if (service?.price) {
      setServicePrice(service.price.toString())
    }
  }

  return {
    newTaskTitle,
    setNewTaskTitle,
    copied,
    isServiceDialogOpen,
    setIsServiceDialogOpen,
    selectedServiceId,
    serviceQuantity,
    setServiceQuantity,
    servicePrice,
    setServicePrice,
    isPaymentDialogOpen,
    setIsPaymentDialogOpen,
    paymentServiceId,
    setPaymentServiceId,
    paymentAmount,
    setPaymentAmount,
    paymentDescription,
    setPaymentDescription,
    addTask,
    toggleTask,
    deleteTask,
    copyPortalLink,
    handleSendReminder,
    createDefaultBriefing,
    addServiceToProject,
    removeServiceFromProject,
    registerPayment,
    handleSelectService,
  }
}
