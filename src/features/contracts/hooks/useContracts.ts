import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { logger } from '@/services/logger'
import { Contract, Client } from '../types'
import { deletePhotoSafely, uploadImageSafely } from '@/lib/upload'
import { useContractsQuery } from './useContractsQuery'
import { useContractMutations } from './useContractMutations'

export const useContracts = () => {
  const { user } = useAuth()
  const { data: contractsData = [], isLoading: loading } = useContractsQuery()
  const { createMutation, signMutation, updateMutation } = useContractMutations()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newClient, setNewClient] = useState('')
  const [newContent, setNewContent] = useState('')
  const [clients, setClients] = useState<Client[]>([])

  const [signatureOpen, setSignatureOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  )

  const fetchClients = useCallback(async () => {
    const { data } = await supabase
      .from('wedding_clients')
      .select('id, name:full_name')
      .order('full_name')
    if (data) setClients(data)
  }, [])

  useEffect(() => {
    if (user) {
      fetchClients()
    }
  }, [user, fetchClients])

  const handleCreate = async () => {
    if (!newTitle || !newClient) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      await createMutation.mutateAsync({
        user_id: user?.id,
        title: newTitle,
        client_id: newClient,
        content: newContent || 'Conteúdo do contrato...',
        status: 'draft',
      })
      setIsDialogOpen(false)
      setNewTitle('')
      setNewClient('')
      setNewContent('')
    } catch (error) {
      logger.error(error, 'useContracts.handleCreate')
    }
  }

  const handleSignatureSave = async (dataUrl: string) => {
    if (!selectedContract) return

    let publicUrl: string | null = null
    try {
      const fileName = `${selectedContract.id}_signature_${Date.now()}.png`
      const blob = await fetch(dataUrl).then((res) => res.blob())
      const file = new File([blob], fileName, { type: 'image/png' })

      publicUrl = await uploadImageSafely(
        file,
        'contract-signatures',
        'signatures',
      )

      await signMutation.mutateAsync({
        id: selectedContract.id,
        signature_url: publicUrl,
        project_id: selectedContract.project_id,
      })

      setSignatureOpen(false)
    } catch (error) {
      if (publicUrl) {
        await deletePhotoSafely(publicUrl, 'contract-signatures')
      }
      logger.error(error, 'useContracts.handleSignatureSave')
      toast.error('Erro ao salvar assinatura')
    }
  }

  const handleSend = async (contract: Contract) => {
    try {
      await updateMutation.mutateAsync({
        id: contract.id,
        data: { status: 'sent' },
      })
    } catch (error) {
      logger.error(error, 'useContracts.handleSend')
    }
  }

  const filteredContracts = (contractsData as Contract[]).filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return {
    contracts: contractsData as Contract[],
    filteredContracts,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isDialogOpen,
    setIsDialogOpen,
    isSubmitting: createMutation.isPending || signMutation.isPending,
    newTitle,
    setNewTitle,
    newClient,
    setNewClient,
    newContent,
    setNewContent,
    clients,
    signatureOpen,
    setSignatureOpen,
    selectedContract,
    setSelectedContract,
    handleCreate,
    handleSignatureSave,
    handleSend,
    isSending: updateMutation.isPending,
  }
}
