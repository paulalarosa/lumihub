import { useState } from 'react'
import { logger } from '@/services/logger'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useOrganization } from '@/hooks/useOrganization'
import { exportClientsToCSV } from '@/utils/exportCSV'
import { toast as sonnerToast } from 'sonner'
import { format } from 'date-fns/format'
import { ptBR } from 'date-fns/locale'
import type { ClientFormData } from '../components/ClientForm'
import { getErrorMessage } from '@/utils/error-handler'
import { useClientMutations } from './useClientMutations'
import { useDeleteClient } from './useDeleteClient'

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

  const { createMutation, updateMutation } = useClientMutations()
  const { mutateAsync: deleteClient } = useDeleteClient()

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

    const clientData = {
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
        await updateMutation.mutateAsync({
          id: editingClient.id,
          data: clientData,
        })
      } else {
        await createMutation.mutateAsync(clientData)
      }

      setIsDialogOpen(false)
      setEditingClient(null)
      fetchClients()
    } catch (error) {
      logger.error(error, 'useClientActions.handleFormSubmit')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      await deleteClient(id)
      fetchClients()
    } catch (error) {
      logger.error(error, 'useClientActions.handleDelete')
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
    } catch (error) {
      const { title, description } = getErrorMessage(
        error,
        'Erro ao gerar link',
      )
      toast({
        title,
        description,
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
    } catch (error) {
      logger.error(error, 'useClientActions.handleExportCSV')
      sonnerToast.error('Erro inesperado na exportação')
    } finally {
      setIsExporting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    try {
      return format(new Date(dateString), "d 'de' MMM, yyyy", { locale: ptBR })
    } catch (e) {
      logger.error(e, 'useClientActions.formatDate')
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
