import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { useProjects } from '@/hooks/useProjects'
import { useContractMutations } from './useContractMutations'
import { useContractStorage } from './useContractStorage'
import { logger } from '@/services/logger'

interface UseContractFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultProjectId?: string
}

/**
 * State + submit handler do ContractDialog.
 *
 * Depois da consolidação da rodada de cleanup (2026-04-22), esse hook
 * orquestra `useContractMutations.createMutation` + `useContractStorage`
 * em vez de duplicar lógica via o antigo `useContractCreator` (deletado).
 * Cache invalidation + toasts ficam centralizados nas mutations.
 */
export function useContractForm({
  open,
  onOpenChange,
  defaultProjectId,
}: UseContractFormProps) {
  const { user } = useAuth()
  const { organizationId } = useOrganization()
  const { createMutation } = useContractMutations()
  const { uploadContractFile } = useContractStorage()
  const { projects } = useProjects()

  const [mode, setMode] = useState<'digital' | 'upload'>('digital')
  const [projectId, setProjectId] = useState(defaultProjectId || '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)

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
    if (!user) {
      toast.error('Sessão expirada')
      return
    }
    if (!projectId || !title) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    try {
      let attachmentUrl: string | null = null

      if (mode === 'upload') {
        if (!file) {
          toast.error('Selecione um arquivo PDF')
          return
        }
        attachmentUrl = await uploadContractFile(file)
      } else if (!content || content === '<p></p>') {
        toast.error('Adicione o conteúdo do contrato')
        return
      }

      await createMutation.mutateAsync({
        project_id: projectId,
        title,
        content: mode === 'digital' ? content : '',
        status: 'draft',
        attachment_url: attachmentUrl,
        user_id: organizationId || user.id,
      })

      onOpenChange(false)
    } catch (error) {
      // Toast já disparado pela mutation; logger pra telemetria.
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
    isSaving: createMutation.isPending,
    handleSubmit,
  }
}
