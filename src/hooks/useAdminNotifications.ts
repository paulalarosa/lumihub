import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/services/logger'

interface AdminNotification {
  id: string
  type: string
  title: string
  message: string
  related_id: string | null
  action_url: string | null
  is_read: boolean
  created_at: string
}

interface NotificationsResponse {
  unread_count: number
  notifications: AdminNotification[]
}

export function useAdminNotifications() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const notificationsQuery = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async (): Promise<NotificationsResponse> => {
      const { data, error } = await supabase.rpc('get_admin_notifications', {
        p_limit: 30,
        p_unread_only: false,
      })

      if (error) {
        logger.error('useAdminNotifications.fetch', error)
        throw error
      }

      return data as NotificationsResponse
    },
    staleTime: 1000 * 30,
  })

  const markRead = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const { data, error } = await supabase.rpc('mark_notifications_read', {
        p_notification_ids: notificationIds,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
    },
  })

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread =
        notificationsQuery.data?.notifications?.filter((n) => !n.is_read) || []
      if (unread.length === 0) return 0

      const { data, error } = await supabase.rpc('mark_notifications_read', {
        p_notification_ids: unread.map((n) => n.id),
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
    },
  })

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('admin-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  return {
    notifications: notificationsQuery.data?.notifications || [],
    unreadCount: notificationsQuery.data?.unread_count || 0,
    isLoading: notificationsQuery.isLoading,
    markRead,
    markAllRead,
    refetch: notificationsQuery.refetch,
  }
}
