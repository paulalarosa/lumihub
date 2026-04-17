import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { useToast } from '@/hooks/use-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export interface ClientOption {
  id: string
  name: string
  email?: string | null
}

const createProjectSchema = z.object({
  name: z.string().min(1, 'Nome do projeto é obrigatório'),
  client_id: z.string().min(1, 'Selecione um cliente'),
  client_email: z
    .string()
    .min(1, 'O e-mail do cliente é obrigatório para envio de notificações')
    .email('E-mail do cliente inválido'),
  event_date: z.string().optional(),
  event_location: z.string().optional(),
  event_type: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived', 'lead']).default('active'),
})

export type CreateProjectFormData = z.infer<typeof createProjectSchema>

interface UseNewProjectDialogProps {
  onSuccess: () => void
  onCreateClient?: () => void
}

export function useNewProjectDialog({ onSuccess }: UseNewProjectDialogProps) {
  const { user } = useAuth()
  const { organizationId } = useOrganization()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loadingClients, setLoadingClients] = useState(false)
  const [clients, setClients] = useState<ClientOption[]>([])

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      client_id: '',
      client_email: '',
      event_date: '',
      event_location: '',
      event_type: '',
      notes: '',
      status: 'active',
    },
  })

  const _selectedClientId = form.watch('client_id')

  const loadClients = useCallback(async () => {
    setLoadingClients(true)
    try {
      if (!user) return

      const { data, error } = await supabase
        .from('wedding_clients')
        .select('id, name, email')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (error) throw error

      setClients(data || [])
    } catch (_error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de clientes.',
        variant: 'destructive',
      })
    } finally {
      setLoadingClients(false)
    }
  }, [user, toast])

  useEffect(() => {
    if (open) {
      loadClients()
    }
  }, [open, loadClients])

  const onSubmit = async (data: CreateProjectFormData) => {
    if (!user || !organizationId) return

    try {
      const newProject = {
        name: data.name.trim(),
        client_id: data.client_id,
        user_id: organizationId,
        event_date: data.event_date || null,
        event_location: data.event_location?.trim() || null,
        event_type: data.event_type || null,
        notes: data.notes?.trim() || null,
        status: data.status,
      }

      const { data: projectData, error: dbError } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single()

      if (dbError) throw dbError

      try {
        if (data.client_email) {
          const { error: emailError } = await supabase.functions.invoke(
            'send-welcome-email',
            {
              body: {
                record: {
                  ...projectData,
                  client_email: data.client_email,
                },
              },
            },
          )

          if (emailError) throw emailError
        }
      } catch (emailError) {
        void emailError
      }

      toast({
        title: 'Projeto Criado',
        description: `${data.name} foi criado com sucesso.`,
      })

      form.reset()
      setOpen(false)
      onSuccess()
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro ao salvar o projeto.'
      toast({
        title: 'Erro ao Criar Projeto',
        description: message,
        variant: 'destructive',
      })
    }
  }

  return {
    open,
    setOpen,
    loadingClients,
    clients,
    form,
    onSubmit,
  }
}
