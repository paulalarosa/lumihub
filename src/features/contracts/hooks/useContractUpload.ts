import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { logger } from '@/services/logger'
import { useQueryClient } from '@tanstack/react-query'

interface UseContractUploadProps {
  clientId?: string
}

export const useContractUpload = ({
  clientId: initialClientId,
}: UseContractUploadProps = {}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const uploadFile = async (file: File, clientId?: string) => {
    const targetId = clientId || initialClientId
    if (!targetId) {
      logger.error(
        new Error('No Client ID provided for upload.'),
        'useContractUpload.uploadFile',
        { showToast: false },
      )
      // Allow upload without ID? User said "Rename: clientId + ..."
      // If no ID, we can't construct the requested filename correctly or update DB.
      // But let's proceed with a fallback for filename, and skip DB update if no ID.
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Validate file type
      if (file.type !== 'application/pdf') {
        throw new Error('INVALID_FILE_TYPE: Please upload a PDF file.')
      }

      // Generate unique filename
      const timestamp = Date.now()
      const idToUse = targetId || 'temp'
      const safeFileName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()
      const filePath = `${idToUse}_${timestamp}_${safeFileName}`

      // Upload to Supabase Storage
      const { _data, error } = await supabase.storage
        .from('contracts')
        .upload(filePath, file)

      if (error) {
        logger.error(error, 'useContractUpload.storageUpload', {
          showToast: false,
        })
        throw new Error('UPLOAD_FAILED: ' + error.message)
      }

      // Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('contracts').getPublicUrl(filePath)

      // Update Database if we have a client ID
      if (targetId) {
        const { error: dbError } = await supabase
          .from('profiles')
          .update({ contract_url: publicUrl })
          .eq('id', targetId)

        if (dbError) {
          logger.error(dbError, 'useContractUpload.dbUpdate', {
            showToast: false,
          })
          // We don't throw here to avoid failing the whole process if just the DB update fails,
          // but usually we should. Let's log and warn.
          toast.warning('File uploaded but failed to link to client record.')
        } else {
          queryClient.invalidateQueries({ queryKey: ['clients'] })
          toast.success('CONTRACT UPLOADED & LINKED SUCCESSFULLY')
        }
      } else {
        toast.success('FILE TRANSMITTED (NO CLIENT LINK)')
      }

      return publicUrl
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'UNKNOWN UPLOAD ERROR'
      setUploadError(message)
      toast.error(message)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  return {
    uploadFile,
    isUploading,
    uploadError,
  }
}
