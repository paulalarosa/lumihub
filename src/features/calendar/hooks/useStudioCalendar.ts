import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'

export interface StudioEvent {
  id: string
  title: string
  description: string | null
  event_date: string
  start_time: string
  end_time: string
  color: string
  created_by: string
  creator_name: string | null
  created_at: string
}

export function useStudioCalendar(startDate: string, endDate: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const eventsQuery = useQuery({
    queryKey: ['studio-events', startDate, endDate],
    queryFn: async (): Promise<StudioEvent[]> => {
      const { data, error } = await supabase.rpc('get_studio_events', {
        p_start_date: startDate,
        p_end_date: endDate,
      })
      if (error) {
        logger.error('useStudioCalendar.fetch', error)
        throw error
      }
      return (data as StudioEvent[]) || []
    },
    enabled: !!startDate && !!endDate,
  })

  const createEvent = useMutation({
    mutationFn: async (params: {
      title: string
      event_date: string
      start_time: string
      end_time: string
      description?: string
      color?: string
    }) => {
      const { data, error } = await supabase.rpc('create_studio_event', {
        p_title: params.title,
        p_event_date: params.event_date,
        p_start_time: params.start_time,
        p_end_time: params.end_time,
        p_description: params.description || null,
        p_color: params.color || '#ffffff',
      })
      if (error) throw error
      return data as { success: boolean; event_id: string; has_conflict: boolean }
    },
    onSuccess: (data) => {
      toast({
        title: 'Evento criado',
        description: data.has_conflict
          ? 'Atenção: há conflito de horário com outro evento.'
          : 'Adicionado ao calendário do studio.',
        variant: data.has_conflict ? 'destructive' : 'default',
      })
      queryClient.invalidateQueries({ queryKey: ['studio-events'] })
    },
    onError: (error) => {
      logger.error('useStudioCalendar.create', error)
      toast({
        title: 'Erro ao criar evento',
        variant: 'destructive',
      })
    },
  })

  const updateEvent = useMutation({
    mutationFn: async (params: {
      event_id: string
      title: string
      event_date: string
      start_time: string
      end_time: string
      description?: string
      color?: string
    }) => {
      const { data, error } = await supabase.rpc('update_studio_event', {
        p_event_id: params.event_id,
        p_title: params.title,
        p_event_date: params.event_date,
        p_start_time: params.start_time,
        p_end_time: params.end_time,
        p_description: params.description || null,
        p_color: params.color || '#ffffff',
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({ title: 'Evento atualizado' })
      queryClient.invalidateQueries({ queryKey: ['studio-events'] })
    },
    onError: (error) => {
      logger.error('useStudioCalendar.update', error)
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    },
  })

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase.rpc('delete_studio_event', {
        p_event_id: eventId,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({ title: 'Evento removido' })
      queryClient.invalidateQueries({ queryKey: ['studio-events'] })
    },
    onError: (error) => {
      logger.error('useStudioCalendar.delete', error)
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    },
  })

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('studio-calendar-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'studio_events' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['studio-events'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return {
    events: eventsQuery.data || [],
    isLoading: eventsQuery.isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: eventsQuery.refetch,
  }
}

export function useIsStudioMember() {
  const { user, role } = useAuth()

  const { data: isStudio } = useQuery({
    queryKey: ['is-studio-member', user?.id],
    queryFn: async () => {
      if (!user) return false
      if (role === 'admin') return true

      const { data } = await supabase
        .from('profiles')
        .select('subscription_tier, plan')
        .eq('id', user.id)
        .single()

      return data?.subscription_tier === 'studio' || data?.plan === 'studio'
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  })

  return isStudio ?? false
}
