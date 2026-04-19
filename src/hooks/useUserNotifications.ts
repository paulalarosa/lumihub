import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/services/logger'

export interface UserNotification {
  id: string
  type: string
  title: string
  message: string
  related_id: string | null
  action_url: string | null
  is_read: boolean
  created_at: string
}

export function useUserNotifications() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id

  const query = useQuery({
    queryKey: ['user-notifications', userId],
    queryFn: async (): Promise<UserNotification[]> => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        logger.error(error, 'useUserNotifications.fetch')
        return []
      }

      return (data ?? []).map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        related_id: n.related_id,
        action_url: n.action_url,
        is_read: !!n.is_read,
        created_at: n.created_at ?? new Date().toISOString(),
      }))
    },
    enabled: !!userId,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-notifications', userId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!userId || ids.length === 0) return
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', ids)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', userId] })
    },
    onError: (err) => logger.error(err, 'useUserNotifications.markRead'),
  })

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!userId) return
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', userId] })
    },
    onError: (err) => logger.error(err, 'useUserNotifications.markAllRead'),
  })

  const notifications = query.data ?? []
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    markRead,
    markAllRead,
  }
}
