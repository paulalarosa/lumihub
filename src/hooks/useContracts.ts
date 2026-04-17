import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'
import { toast } from 'sonner'
import { Logger } from '@/services/logger'
import { logger } from '@/services/logger'

export interface Contract {
  id: string
  project_id: string
  title: string
  content?: string
  status: string
  created_at: string
  signature_url?: string
  signed_at?: string
  attachment_url?: string
  project?: {
    name: string
  }
}

export function useContracts() {
  const { user, organizationId } = useOrganization()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)

  const fetchContracts = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('contracts')
      .select(
        `
                *,
                project:projects(name)
            `,
      )
      .eq('user_id', organizationId || user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error(error, {
        message: 'Erro ao carregar contratos.',
      })
    } else {
      setContracts(data)
    }
    setLoading(false)
  }

  const createContract = async (
    contract: Partial<Contract> & { project_id: string },
  ) => {
    if (!user) return
    const { data, error } = await supabase
      .from('contracts')
      .insert([
        {
          title: contract.title || 'Contrato',
          content: contract.content || '',
          status: contract.status || 'draft',
          project_id: contract.project_id,
          user_id: organizationId || user.id,
        },
      ])
      .select()
      .single()

    if (error) {
      logger.error(error, {
        message: 'Erro ao criar contrato.',
      })
      throw error
    }

    Logger.action('CONTRACT_CREATE', user.id, 'contracts', data.id, {
      title: data.title,
      project_id: data.project_id,
    })

    setContracts([data, ...contracts])
    toast.success('Contrato criado com sucesso')
    return data
  }

  const uploadContractFile = async (file: File) => {
    if (!user) throw new Error('User not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${organizationId || user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    Logger.action('CONTRACT_UPLOAD', user.id, 'storage.contracts', filePath, {
      fileName: file.name,
    })

    return filePath
  }

  const getFileUrl = async (path: string) => {
    const { data, error } = await supabase.storage
      .from('contracts')
      .createSignedUrl(path, 3600)

    if (error) throw error
    return data.signedUrl
  }

  return {
    contracts,
    loading,
    fetchContracts,
    createContract,
    uploadContractFile,
    getFileUrl,
  }
}
