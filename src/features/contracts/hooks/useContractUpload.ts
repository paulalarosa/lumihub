import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { logger } from '@/services/logger'

export const useContractUpload = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploadFile = async (file: File, customPath?: string) => {
    setIsUploading(true)
    setUploadError(null)

    try {
      const timestamp = Date.now()
      const safeFileName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()
      const filePath = customPath || `temp/${timestamp}_${safeFileName}`

      const { data: _data, error } = await supabase.storage
        .from('contracts')
        .upload(filePath, file)

      if (error) {
        logger.error(error, 'useContractUpload.storageUpload', {
          showToast: false,
        })
        throw new Error('UPLOAD_FAILED: ' + error.message)
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('contracts').getPublicUrl(filePath)

      return { publicUrl, filePath }
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

  const deleteFile = async (filePath: string) => {
    try {
      const { error } = await supabase.storage
        .from('contracts')
        .remove([filePath])

      if (error) throw error
    } catch (err) {
      logger.error(err, 'useContractUpload.deleteFile', { showToast: false })
    }
  }

  return {
    uploadFile,
    deleteFile,
    isUploading,
    uploadError,
  }
}
