import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useOrganization } from '@/hooks/useOrganization'
import { ClientService } from '@/services/clientService'
import { exportClientsToCSV } from '@/utils/exportCSV'
import { toast as sonnerToast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ClientFormData } from '../components/ClientForm'

export interface ClientRecord {
  id: string
  name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  notes: string | null
  last_visit: string | null
  created_at: string
  user_id: string
  is_bride?: boolean
  wedding_date?: string | null
  access_pin?: string | null
  portal_link?: string | null
}

interface UseClientActionsProps {
  fetchClients: () => void
  clients: ClientRecord[]
}

export function useClientActions({
  fetchClients,
  clients,
}: UseClientActionsProps) {
  const { organizationId } = useOrganization()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const openEditDialog = (client: ClientRecord) => {
    setEditingClient(client)
    setIsDialogOpen(true)
  }

  const handleFormSubmit = async (formData: ClientFormData) => {
    if (!organizationId) {
      toast({ title: 'Erro de organização', variant: 'destructive' })
      return
    }

    interface ClientPayload {
      full_name: string
      name: string
      email: string | null
      phone: string | null
      notes: string | null
      user_id: string
      is_bride: boolean
      wedding_date: string | null
      access_pin: string | null
      portal_link?: string
    }

    const clientData: ClientPayload = {
      full_name: formData.name.trim(),
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      notes: formData.notes.trim() || null,
      user_id: organizationId,
      is_bride: Boolean(formData.is_bride),
      wedding_date: formData.wedding_date
        ? new Date(formData.wedding_date).toISOString()
        : null,
      access_pin: formData.access_pin
        ? String(formData.access_pin).trim() || null
        : null,
    }

    try {
      if (editingClient) {
        if (clientData.is_bride) {
          clientData.portal_link = `https://khaoskontrol.com.br/portal/${editingClient.id}`
        }

        await ClientService.update(editingClient.id, clientData)

        if (clientData.is_bride && clientData.wedding_date) {
          const { error: projectError } = await supabase
            .from('projects')
            .update({ event_date: clientData.wedding_date })
            .eq('client_id', editingClient.id)

          if (projectError) {
            toast({
              title: 'Aviso',
              description:
                'Data do cliente salva, mas erro ao sincronizar projeto.',
              variant: 'default',
            })
          }
        }

        toast({ title: 'Cliente atualizado!' })
      } else {
        const newClient = await ClientService.create(clientData)

        if (clientData.is_bride && newClient && 'id' in newClient) {
          const link = `https://khaoskontrol.com.br/portal/${newClient.id}`
          await ClientService.update(newClient.id, { portal_link: link })
        }

        toast({ title: 'Cliente adicionado!' })

        if (clientData.is_bride && clientData.email) {
          try {
            toast({ title: 'Enviando email de boas-vindas...', duration: 2000 })
            const { error: emailError } = await supabase.functions.invoke(
              'send-welcome-email',
              {
                body: {
                  clientId: newClient?.id,
                  subject: 'Bem-vinda ao KONTROL',
                },
              },
            )
            if (emailError) throw emailError
            toast({ title: 'Email enviado com sucesso!', variant: 'default' })
          } catch (_emailErr) {
            toast({
              title: 'Erro ao enviar email',
              description: 'O cliente foi salvo, mas o email falhou.',
              variant: 'destructive',
            })
          }
        }
      }

      setIsDialogOpen(false)
      setEditingClient(null)
      fetchClients()
    } catch (_error) {
      toast({ title: 'Erro ao salvar cliente', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      await ClientService.delete(id)
      toast({ title: 'Cliente excluído!' })
      fetchClients()
    } catch (_error) {
      toast({ title: 'Erro ao excluir cliente', variant: 'destructive' })
    }
  }

  const copyPortalLink = async (clientId: string) => {
    try {
      const { data: client, error: clientError } = await supabase
        .from('wedding_clients')
        .select('access_pin')
        .eq('id', clientId)
        .single()

      if (clientError) throw clientError

      if (!client?.access_pin) {
        const newPin = Math.floor(1000 + Math.random() * 9000).toString()
        const { error: updateError } = await supabase
          .from('wedding_clients')
          .update({ access_pin: newPin })
          .eq('id', clientId)
        if (updateError) throw updateError
        toast({ title: 'PIN Gerado', description: `Novo PIN: ${newPin}` })
      }

      const link = `${window.location.origin}/portal/${clientId}/login`
      await navigator.clipboard.writeText(link)
      toast({
        title: 'Link do Portal Copiado!',
        description: 'Envie este link para a noiva.',
      })
    } catch (_e) {
      toast({
        title: 'Erro ao gerar link',
        description: 'Não foi possível configurar o portal.',
        variant: 'destructive',
      })
    }
  }

  const handleExportCSV = async () => {
    if (clients.length === 0) {
      sonnerToast.error('Nenhum cliente para exportar')
      return
    }

    setIsExporting(true)
    try {
      const result = exportClientsToCSV(clients)
      if (result.success) {
        sonnerToast.success('Arquivo CSV exportado com sucesso!')
      } else {
        sonnerToast.error(result.error || 'Erro ao exportar')
      }
    } catch (_error) {
      sonnerToast.error('Erro inesperado na exportação')
    } finally {
      setIsExporting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    try {
      return format(new Date(dateString), "d 'de' MMM, yyyy", { locale: ptBR })
    } catch (_e) {
      return 'Data inválida'
    }
  }

  return {
    isDialogOpen,
    setIsDialogOpen,
    editingClient,
    setEditingClient,
    isExporting,
    openEditDialog,
    handleFormSubmit,
    handleDelete,
    copyPortalLink,
    handleExportCSV,
    formatDate,
  }
}
