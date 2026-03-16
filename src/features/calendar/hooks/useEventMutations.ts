import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'

export function useEventMutations() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const createMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const { data: event, error } = await supabase
        .from('calendar_events')
        .insert(eventData)
        .select()
        .single()

      if (error) throw error

      // Sync logic
      try {
        await supabase.functions.invoke('sync-event-to-google', {
          body: { event_id: event.id, action: 'create' },
        })
      } catch (syncError) {
        logger.warning('Falha ao sincronizar com Google Calendar:', syncError)
      }

      return event
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR_EVENTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast({ title: 'Evento criado!' })
    },
    onError: (error) => {
      logger.error(error, 'useEventMutations.create')
      toast({
        title: 'Erro ao criar evento',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: event, error } = await supabase
        .from('calendar_events')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Sync logic
      try {
        await supabase.functions.invoke('sync-event-to-google', {
          body: { event_id: id, action: 'update' },
        })
      } catch (syncError) {
        logger.warning('Falha ao sincronizar com Google Calendar:', syncError)
      }

      return event
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', variables.id] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR_EVENTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast({ title: 'Evento atualizado!' })
    },
    onError: (error) => {
      logger.error(error, 'useEventMutations.update')
      toast({
        title: 'Erro ao atualizar evento',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Sync logic
      try {
        await supabase.functions.invoke('sync-event-to-google', {
          body: { event_id: id, action: 'delete' },
        })
      } catch (syncError) {
        logger.warning('Falha ao sincronizar com Google Calendar:', syncError)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR_EVENTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast({ title: 'Evento excluído!' })
    },
    onError: (error) => {
      logger.error(error, 'useEventMutations.delete')
      toast({
        title: 'Erro ao excluir evento',
        variant: 'destructive',
      })
    },
  })

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  }
}
