import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useContracts } from '@/hooks/useContracts'
import { useProjects } from '@/hooks/useProjects'
import { logger } from '@/services/logger'

interface UseContractFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultProjectId?: string
}

export function useContractForm({
  open,
  onOpenChange,
  defaultProjectId,
}: UseContractFormProps) {
  const {
    createContract,
    uploadContractFile,
    loading: isSaving,
  } = useContracts()
  const { projects } = useProjects()

  const [mode, setMode] = useState<'digital' | 'upload'>('digital')
  const [projectId, setProjectId] = useState(defaultProjectId || '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setProjectId(defaultProjectId || '')
      setTitle('')
      setContent('')
      setFile(null)
      setMode('digital')
    }
  }, [open, defaultProjectId])

  const handleSubmit = async () => {
    if (!projectId || !title) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    try {
      let attachmentUrl = null

      if (mode === 'upload') {
        if (!file) {
          toast.error('Selecione um arquivo PDF')
          return
        }
        const path = await uploadContractFile(file)
        attachmentUrl = path
      } else {
        if (!content || content === '<p></p>') {
          toast.error('Adicione o conteúdo do contrato')
          return
        }
      }

      await createContract({
        project_id: projectId,
        title,
        content: mode === 'digital' ? content : undefined,
        status: 'draft',
        attachment_url: attachmentUrl || undefined,
      })

      onOpenChange(false)
      toast.success('Contrato salvo com sucesso!')
    } catch (error) {
      logger.error(error, {
        message: 'Erro ao salvar contrato.',
        context: { projectId },
      })
    }
  }

  return {
    mode,
    setMode,
    projectId,
    setProjectId,
    title,
    setTitle,
    content,
    setContent,
    file,
    setFile,
    projects,
    isSaving,
    handleSubmit,
  }
}
