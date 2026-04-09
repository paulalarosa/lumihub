import { useState, useRef, useEffect } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAdminNotifications } from '@/hooks/useAdminNotifications'
import { Button } from '@/components/ui/button'

export function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markRead, markAllRead } =
    useAdminNotifications()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const typeIcon: Record<string, string> = {
    new_signup: '👤',
    payment_received: '💰',
    subscription_change: '⚡',
  }

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'agora'
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative h-10 w-10 border border-white/20 flex items-center justify-center bg-black hover:bg-white/10 transition-colors"
      >
        <Bell className="h-5 w-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-white text-black text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-black border border-white/20 shadow-2xl z-[100] max-h-[480px] flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
              Notificações
            </span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead.mutate()}
                className="h-6 px-2 text-[10px] font-mono uppercase tracking-wider rounded-none text-white hover:bg-white/10"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Ler todas
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="h-8 w-8 mx-auto mb-3 text-zinc-800" />
                <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">
                  Nenhuma notificação
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) markRead.mutate([n.id])
                    if (n.action_url) {
                      navigate(n.action_url)
                      setOpen(false)
                    }
                  }}
                  className={`w-full text-left px-4 py-4 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-3 group ${
                    !n.is_read ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5 grayscale group-hover:grayscale-0 transition-all">
                    {typeIcon[n.type] || '📋'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-mono text-[11px] truncate tracking-tight ${!n.is_read ? 'text-white font-bold' : 'text-zinc-400'}`}
                      >
                        {n.title}
                      </span>
                      <span className="font-mono text-[9px] text-zinc-600 flex-shrink-0">
                        {formatTime(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate mt-1 font-sans">
                      {n.message}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0 mt-2 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
