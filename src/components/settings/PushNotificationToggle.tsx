import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Bell, BellOff, Smartphone } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function PushNotificationToggle() {
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
  } = usePushNotifications()

  if (!isSupported) {
    return (
      <Card className="bg-background border border-border rounded-none">
        <CardContent className="p-4 flex items-center gap-4">
          <BellOff className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">
              Notificações push não são suportadas neste navegador.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribe()
    } else {
      await unsubscribe()
    }
  }

  return (
    <Card className="bg-background border border-border rounded-none">
      <CardHeader className="border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-foreground" />
          <CardTitle className="font-serif text-lg">
            Notificações Push
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex-1 mr-4">
            <span className="font-mono text-xs text-foreground font-medium">
              Receber notificações
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Novos eventos, lembretes e atualizações importantes.
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={loading || permission === 'denied'}
          />
        </div>

        {permission === 'denied' && (
          <div className="px-6 py-3 bg-destructive/10 border-b border-border/50">
            <p className="text-[11px] text-destructive">
              Notificações bloqueadas pelo navegador. Acesse as configurações do
              navegador para permitir.
            </p>
          </div>
        )}

        {isSubscribed && (
          <div className="px-6 py-3 flex items-center gap-2">
            <Smartphone className="h-3 w-3 text-green-500" />
            <span className="font-mono text-[10px] text-green-600 dark:text-green-400 uppercase tracking-widest">
              Push ativo neste dispositivo
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
