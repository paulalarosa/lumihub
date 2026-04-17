import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'
import { sanitizeFormData } from '@/lib/security'

export function useEventMutations() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const createMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const cleanData = sanitizeFormData(eventData)
      
      const { data: event, error } = await supabase
        .from('events')
        .insert({
          ...cleanData,
          start_time: cleanData.start_time?.split('T')[1]?.substring(0, 5),
          end_time: cleanData.end_time?.split('T')[1]?.substring(0, 5),
          event_date: cleanData.start_time?.split('T')[0],
        })
        .select()
        .single()

      if (error) throw error

      try {
        await supabase.functions.invoke('google-calendar-sync', {
          body: { 
            action: 'create',
            event_id: event.id,
            event_data: {
              title: event.title,
              description: event.description || '',
              event_date: event.event_date,
              start_time: event.start_time || '09:00',
              end_time: event.end_time,
              location: event.location || '',
            }
          },
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
      const cleanData = sanitizeFormData(data)
      const { data: event, error } = await supabase
        .from('events')
        .update({
          ...cleanData,
          start_time: cleanData.start_time?.split('T')[1]?.substring(0, 5),
          end_time: cleanData.end_time?.split('T')[1]?.substring(0, 5),
          event_date: cleanData.start_time?.split('T')[0],
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      try {
        await supabase.functions.invoke('google-calendar-sync', {
          body: { 
            action: 'update',
            event_id: id,
            event_data: {
              title: event.title,
              description: event.description || '',
              event_date: event.event_date,
              start_time: event.start_time || '09:00',
              end_time: event.end_time,
              location: event.location || '',
            }
          },
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
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error

      try {
        await supabase.functions.invoke('google-calendar-sync', {
          body: { action: 'delete', event_id: id },
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
