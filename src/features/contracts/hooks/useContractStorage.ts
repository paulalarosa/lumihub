import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { Logger } from '@/services/logger'

/**
 * Operações de storage específicas de contrato — upload do PDF original
 * (contratos carregados, não gerados via editor) e signed URL pra leitura.
 *
 * Separado da `useContractMutations` porque DB mutations e storage têm
 * ciclos de vida diferentes (storage não invalida React Query cache).
 */
export function useContractStorage() {
  const { user } = useAuth()
  const { organizationId } = useOrganization()

  const uploadContractFile = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated')

    const fileExt = file.name.split('.').pop()
    const ownerId = organizationId || user.id
    const filePath = `${ownerId}/${Math.random().toString(36).substring(2)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    Logger.action('CONTRACT_UPLOAD', user.id, 'storage.contracts', filePath, {
      fileName: file.name,
    })

    return filePath
  }

  const getFileUrl = async (path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('contracts')
      .createSignedUrl(path, 3600)

    if (error) throw error
    return data.signedUrl
  }

  return { uploadContractFile, getFileUrl }
}
