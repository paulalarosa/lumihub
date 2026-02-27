import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface EventActionButtonsProps {
  eventId: string
  assistantId: string
  currentStatus: string
}

export function EventActionButtons({
  eventId,
  assistantId,
  currentStatus,
}: EventActionButtonsProps) {
  const queryClient = useQueryClient()

  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'accepted' | 'declined') => {
      const { error } = await supabase
        .from('event_assistants')
        .update({ status } as never)
        .eq('event_id', eventId)
        .eq('assistant_id', assistantId)

      if (error) throw error
    },
    onSuccess: (_data, status) => {
      queryClient.invalidateQueries({ queryKey: ['assistant-events'] })
      queryClient.invalidateQueries({ queryKey: ['assistant-artist-events'] })
      toast.success(
        status === 'accepted' ? 'Evento aceito!' : 'Evento recusado',
      )
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao atualizar status')
    },
  })

  if (currentStatus === 'accepted') {
    return (
      <Badge className="bg-green-900/30 text-green-400 border-green-800">
        Aceito
      </Badge>
    )
  }

  if (currentStatus === 'declined') {
    return (
      <Badge variant="destructive" className="opacity-70">
        Recusado
      </Badge>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => updateStatusMutation.mutate('accepted')}
        disabled={updateStatusMutation.isPending}
        className="bg-green-600 hover:bg-green-700"
      >
        <Check className="w-4 h-4 mr-1" />
        Aceitar
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => updateStatusMutation.mutate('declined')}
        disabled={updateStatusMutation.isPending}
      >
        <X className="w-4 h-4 mr-1" />
        Recusar
      </Button>
    </div>
  )
}
