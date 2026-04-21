import { useState } from 'react'
import { toast } from 'sonner'
import { logger } from '@/services/logger'
import { Contract } from '../types'
import { deletePhotoSafely, uploadImageSafely } from '@/lib/upload'
import { useContractsQuery } from './useContractsQuery'
import { useContractMutations } from './useContractMutations'

export const useContracts = () => {
  const { data: contractsData = [], isLoading: loading } = useContractsQuery()
  const { signMutation, updateMutation } = useContractMutations()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // ContractDialog (create flow) has its own form state via useContractForm.
  // Keep only the open/close toggle here.
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [signatureOpen, setSignatureOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  )

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
    isSubmitting: signMutation.isPending,
    signatureOpen,
    setSignatureOpen,
    selectedContract,
    setSelectedContract,
    handleSignatureSave,
    handleSend,
    isSending: updateMutation.isPending,
  }
}
