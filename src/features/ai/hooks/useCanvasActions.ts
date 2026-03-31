import { useAIStore, Canvas } from '@/stores/useAIStore'
import { AIDomainService } from '@/features/ai/services/AIDomainService'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useCanvasActions = () => {
  const {
    canvases,
    activeCanvasId,
    isCanvasOpen,
    updateCanvas: updateStore,
    createCanvas: createStore,
    setActiveCanvas,
  } = useAIStore()

  const queryClient = useQueryClient()

  const activeCanvas = canvases.find((c) => c.id === activeCanvasId)

  const saveMutation = useMutation({
    mutationFn: async ({ id, title, content, type }: Canvas) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase.from('ai_documents').upsert({
        id,
        user_id: user.id,
        title,
        content,
        type,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Documento sincronizado com a nuvem!')
      queryClient.invalidateQueries({ queryKey: ['ai-documents'] })
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar: ' + error.message)
    },
  })

  const handleCreateCanvas = (
    title: string,
    content: string,
    type: Canvas['type'],
  ) => {
    const newCanvas = AIDomainService.createCanvas(title, content, type)
    createStore(newCanvas)
    return newCanvas.id
  }

  const handleUpdateCanvas = async (id: string, updates: Partial<Canvas>) => {
    const preparedUpdates = AIDomainService.prepareCanvasUpdate(updates)
    updateStore(id, preparedUpdates)

    const canvas = canvases.find((c) => c.id === id)
    if (canvas) {
      const fullCanvas = { ...canvas, ...preparedUpdates }
      saveMutation.mutate(fullCanvas)
    }
  }

  return {
    activeCanvas,
    activeCanvasId,
    isCanvasOpen,
    isSaving: saveMutation.isPending,
    createCanvas: handleCreateCanvas,
    updateCanvas: handleUpdateCanvas,
    saveCanvas: (canvas: Canvas) => saveMutation.mutate(canvas),
    setActiveCanvas,
  }
}
