import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NotificationRecord {
  id: string
  type: string
  title: string
  message: string
  related_id: string | null
  action_url: string | null
  is_read: boolean
  created_at: string
}

export function NotificationCenter() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assistant_notifications' as const)
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(15)

      if (error) {
        const { data: fallback, error: fallbackErr } = await supabase.rpc(
          'get_user_notifications' as never,
          { p_user_id: user!.id } as never,
        )
        if (fallbackErr) return [] as NotificationRecord[]
        return (fallback || []) as NotificationRecord[]
      }
      return (data || []) as unknown as NotificationRecord[]
    },
    enabled: !!user,
    refetchInterval: 30000,
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await supabase
        .from('assistant_notifications' as const)
        .update({ is_read: true, read_at: new Date().toISOString() } as never)
        .eq('id', notificationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0

  const handleNotificationClick = (notification: NotificationRecord) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id)
    }
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-neutral-800">
          <h3 className="font-semibold text-white text-sm">Notificações</h3>
        </div>

        {notifications && notifications.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={cn(
                  'w-full text-left p-3 hover:bg-neutral-800/50 transition-colors border-b border-neutral-800/50 last:border-0',
                  !notification.is_read && 'bg-neutral-900/80',
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-neutral-600 mt-1">
                      {new Date(notification.created_at).toLocaleString(
                        'pt-BR',
                      )}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Bell className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-neutral-500 text-sm">Nenhuma notificação</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
