import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  ExternalLink,
  Bell,
  RefreshCw,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react'
import { format } from 'date-fns/format'

import { ptBR } from 'date-fns/locale'
import {
  useIntegrations,
  type NotificationSettings,
} from '@/hooks/useIntegrations'
import { InstagramConnect } from '@/components/instagram/InstagramConnect'
import { PostScheduler } from '@/components/instagram/PostScheduler'
import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function IntegrationsTab() {
  const ig = useIntegrations()
  const [searchParams] = useSearchParams()
  const instagramStatus = searchParams.get('instagram')

  useEffect(() => {
    if (instagramStatus === 'success') {
      toast.success('Instagram conectado com sucesso!')
    } else if (instagramStatus === 'error') {
      toast.error('Erro ao conectar Instagram. Tente novamente.')
    }
  }, [instagramStatus])

  if (ig.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const googleIntegration = ig.getIntegrationByProvider('google')

  return (
    <div className="space-y-6">
      {/* Redes Sociais */}
      <Card className="border-border bg-card rounded-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              Redes Sociais
            </CardTitle>
            <CardDescription className="font-mono text-[10px] uppercase tracking-widest mt-1">
              Automação Instagram
            </CardDescription>
          </div>
          <PostScheduler />
        </CardHeader>
        <CardContent>
          <InstagramConnect />
        </CardContent>
      </Card>

      <Card className="border-border bg-card rounded-none shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            Sincronização
          </CardTitle>
          <CardDescription className="font-mono text-[10px] uppercase tracking-widest">
            Calendário e Agenda Digital
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 border border-border bg-background/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white flex items-center justify-center border border-border">
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-serif text-lg">Google Calendar</p>
                  {googleIntegration ? (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-none border-green-500/50 text-green-500 bg-green-500/10 font-mono text-[10px] uppercase"
                      >
                        CONECTADO
                      </Badge>
                      {googleIntegration.last_sync_at && (
                        <span className="text-[10px] text-muted-foreground font-mono uppercase">
                          Last Sync:{' '}
                          {format(
                            new Date(googleIntegration.last_sync_at),
                            'dd/MM HH:mm',
                            { locale: ptBR },
                          )}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground font-mono uppercase">
                      OFFLINE
                    </p>
                  )}
                </div>
              </div>
              {googleIntegration ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    ig.disconnectCalendar(googleIntegration.id, 'google')
                  }
                  className="rounded-none font-mono text-xs uppercase tracking-widest hover:bg-destructive hover:text-white border-border"
                >
                  Desconectar
                </Button>
              ) : (
                <Button
                  onClick={ig.connectGoogleCalendar}
                  disabled={ig.connecting}
                  className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-widest px-6"
                >
                  {ig.connecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  CONECTAR
                </Button>
              )}
            </div>

            {googleIntegration && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => ig.syncCalendar('from-google')}
                  disabled={ig.syncing !== null}
                  className="rounded-none border-border font-mono text-[10px] uppercase tracking-widest"
                >
                  {ig.syncing === 'from-google' ? (
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="h-3 w-3 mr-2" />
                  )}
                  Importar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => ig.syncCalendar('to-google')}
                  disabled={ig.syncing !== null}
                  className="rounded-none border-border font-mono text-[10px] uppercase tracking-widest"
                >
                  {ig.syncing === 'to-google' ? (
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <ArrowUpFromLine className="h-3 w-3 mr-2" />
                  )}
                  Exportar
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border border-border bg-muted/5 opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <span className="font-bold text-blue-500">O</span>
                </div>
                <div>
                  <p className="font-serif">Outlook</p>
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">
                    Em Breve
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border border-border bg-muted/5 opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 flex items-center justify-center border border-white/20">
                  <span className="font-bold">A</span>
                </div>
                <div>
                  <p className="font-serif">Apple</p>
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">
                    Em Breve
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card rounded-none shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            Notificações
          </CardTitle>
          <CardDescription className="font-mono text-[10px] uppercase tracking-widest">
            Alertas por E-mail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-mono text-xs uppercase">
                Ativar notificações por e-mail
              </Label>
              <p className="text-xs text-muted-foreground">
                Receba resumos diários e alertas importantes
              </p>
            </div>
            <Switch
              checked={ig.notificationSettings.email_enabled}
              onCheckedChange={(checked) =>
                ig.setNotificationSettings({
                  ...ig.notificationSettings,
                  email_enabled: checked,
                })
              }
            />
          </div>

          {ig.notificationSettings.email_enabled && (
            <>
              <div className="border-t border-border pt-6">
                <Label className="mb-4 block font-mono text-xs uppercase text-muted-foreground">
                  Lembretes Antecipados (Dias)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 5, 7, 14, 30].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => ig.toggleReminderDay(day)}
                      className={`px-4 py-2 text-xs font-mono border transition-colors ${
                        ig.notificationSettings.reminder_days.includes(day)
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-transparent text-muted-foreground border-border hover:border-foreground/50'
                      }`}
                    >
                      {day}D
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <Label className="font-mono text-xs uppercase text-muted-foreground mb-4 block">
                  Eventos Gatilho
                </Label>
                {[
                  { key: 'notify_new_event', label: 'NOVO EVENTO' },
                  {
                    key: 'notify_event_update',
                    label: 'ATUALIZAÇÃO DE EVENTO',
                  },
                  { key: 'notify_event_cancel', label: 'CANCELAMENTO' },
                  {
                    key: 'notify_assistant_assigned',
                    label: 'ASSISTENTE DESIGNADO',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono uppercase">
                        {item.label}
                      </span>
                    </div>
                    <Switch
                      checked={
                        ig.notificationSettings[
                          item.key as keyof NotificationSettings
                        ] as boolean
                      }
                      onCheckedChange={(checked) =>
                        ig.setNotificationSettings({
                          ...ig.notificationSettings,
                          [item.key]: checked,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              onClick={ig.saveNotificationSettings}
              disabled={ig.saving}
              className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-widest px-8"
            >
              {ig.saving ? 'SALVANDO...' : 'SALVAR_PREFERÊNCIAS'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border bg-card rounded-none shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            Status de Entrega
          </CardTitle>
          <CardDescription className="font-mono text-[10px] uppercase tracking-widest">
            Saúde do Sistema de E-mail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 border border-border bg-muted/20">
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                Bounces
              </p>
              <p className="text-2xl font-serif text-foreground">
                {ig.deliverabilityStatus.bounces}
              </p>
            </div>
            <div className="p-4 border border-border bg-muted/20">
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                Reclamações
              </p>
              <p className="text-2xl font-serif text-foreground">
                {ig.deliverabilityStatus.complaints}
              </p>
            </div>
            <div className="p-4 border border-border bg-muted/20">
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                Contatos Inválidos
              </p>
              <p className="text-2xl font-serif text-foreground">
                {ig.deliverabilityStatus.invalid_profiles +
                  ig.deliverabilityStatus.invalid_clients +
                  ig.deliverabilityStatus.invalid_leads +
                  ig.deliverabilityStatus.invalid_invites}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 border border-yellow-500/20 bg-yellow-500/5">
            <p className="text-[10px] font-mono text-yellow-500 uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              Monitoramento Ativo
            </p>
            <p className="text-xs text-muted-foreground mt-2 font-mono uppercase leading-relaxed">
              O sistema monitora automaticamente bounces e reclamações via AWS
              SNS. Recetores que falham são removidos das próximas transmissões
              para proteger a reputação do seu domínio.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
