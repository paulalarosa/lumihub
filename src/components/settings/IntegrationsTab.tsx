import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  Mail,
  Bell,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserIntegration {
  id: string;
  provider: string;
  is_active: boolean;
  sync_enabled: boolean;
  last_sync_at: string | null;
}

interface NotificationSettings {
  id?: string;
  email_enabled: boolean;
  reminder_days: number[];
  notify_new_event: boolean;
  notify_event_update: boolean;
  notify_event_cancel: boolean;
  notify_assistant_assigned: boolean;
}

export default function IntegrationsTab() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_enabled: true,
    reminder_days: [1, 3, 7],
    notify_new_event: true,
    notify_event_update: true,
    notify_event_cancel: true,
    notify_assistant_assigned: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Listen for OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code && state) {
        setConnecting(true);
        try {
          // Verify session is active (Supabase handles the exchange)
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) throw error;

          if (session?.provider_token) {
            toast({
              title: "Google Calendar conectado!",
              description: "Autenticação realizada com sucesso."
            });
          }

          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          fetchData();
        } catch (error: any) {
          console.error('OAuth callback error:', error);
          toast({
            title: "Erro ao conectar",
            description: error.message || "Não foi possível conectar ao Google Calendar",
            variant: "destructive"
          });
        } finally {
          setConnecting(false);
        }
      }
    };

    handleCallback();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch integrations
    const { data: integrationsData } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user!.id);

    setIntegrations(integrationsData || []);

    // Fetch notification settings
    const { data: notifData } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (notifData) {
      setNotificationSettings({
        id: notifData.id,
        email_enabled: notifData.email_enabled,
        reminder_days: notifData.reminder_days || [1, 3, 7],
        notify_new_event: notifData.notify_new_event,
        notify_event_update: notifData.notify_event_update,
        notify_event_cancel: notifData.notify_event_cancel,
        notify_assistant_assigned: notifData.notify_assistant_assigned
      });
    }

    setLoading(false);
  };

  const connectGoogleCalendar = async () => {
    setConnecting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/configuracoes`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;
      // Redirect happens automatically
    } catch (error: any) {
      console.error('Error connecting Google Calendar:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível iniciar a conexão",
        variant: "destructive"
      });
      setConnecting(false);
    }
  };

  const disconnectCalendar = async (integrationId: string, provider: string) => {
    try {
      // Just remove from local DB
      const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('id', integrationId);

      if (error) {
        toast({ title: "Erro ao desconectar", variant: "destructive" });
      } else {
        toast({ title: "Calendário desconectado" });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Erro ao desconectar", variant: "destructive" });
    }
  };

  const syncCalendar = async (direction: 'from-google' | 'to-google') => {
    setSyncing(direction);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.provider_token) {
        throw new Error("Não autenticado com Google");
      }

      // Client-side fetch to verify connection
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10',
        {
          headers: {
            'Authorization': `Bearer ${session.provider_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao contactar Google API");
      }

      const data = await response.json();

      toast({
        title: "Sincronização concluída!",
        description: `Conexão verificada. ${data.items?.length || 0} eventos encontrados.`
      });

      fetchData();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: "Erro na sincronização",
        description: error.message || "Não foi possível sincronizar",
        variant: "destructive"
      });
    } finally {
      setSyncing(null);
    }
  };

  const toggleReminderDay = (day: number) => {
    const currentDays = notificationSettings.reminder_days;
    if (currentDays.includes(day)) {
      setNotificationSettings({
        ...notificationSettings,
        reminder_days: currentDays.filter(d => d !== day)
      });
    } else {
      setNotificationSettings({
        ...notificationSettings,
        reminder_days: [...currentDays, day].sort((a, b) => a - b)
      });
    }
  };

  const saveNotificationSettings = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: user!.id,
        ...notificationSettings
      }, { onConflict: 'user_id' });

    if (error) {
      toast({ title: "Erro ao salvar configurações", variant: "destructive" });
    } else {
      toast({ title: "Configurações de notificação salvas!" });
    }
    setSaving(false);
  };

  const getIntegrationByProvider = (provider: string) => {
    return integrations.find(i => i.provider === provider);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const googleIntegration = getIntegrationByProvider('google');

  return (
    <div className="space-y-6">
      {/* Integrações de Calendário */}
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
          {/* Google Calendar */}
          <div className="p-6 border border-border bg-background/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white flex items-center justify-center border border-border">
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <div>
                  <p className="font-serif text-lg">Google Calendar</p>
                  {googleIntegration ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-none border-green-500/50 text-green-500 bg-green-500/10 font-mono text-[10px] uppercase">
                        CONECTADO
                      </Badge>
                      {googleIntegration.last_sync_at && (
                        <span className="text-[10px] text-muted-foreground font-mono uppercase">
                          Last Sync: {format(new Date(googleIntegration.last_sync_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground font-mono uppercase">OFFLINE</p>
                  )}
                </div>
              </div>
              {googleIntegration ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnectCalendar(googleIntegration.id, 'google')}
                  className="rounded-none font-mono text-xs uppercase tracking-widest hover:bg-destructive hover:text-white border-border"
                >
                  Desconectar
                </Button>
              ) : (
                <Button
                  onClick={connectGoogleCalendar}
                  disabled={connecting}
                  className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-widest px-6"
                >
                  {connecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  CONECTAR
                </Button>
              )}
            </div>

            {/* Sync buttons */}
            {googleIntegration && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncCalendar('from-google')}
                  disabled={syncing !== null}
                  className="rounded-none border-border font-mono text-[10px] uppercase tracking-widest"
                >
                  {syncing === 'from-google' ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <ArrowDownToLine className="h-3 w-3 mr-2" />}
                  Importar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncCalendar('to-google')}
                  disabled={syncing !== null}
                  className="rounded-none border-border font-mono text-[10px] uppercase tracking-widest"
                >
                  {syncing === 'to-google' ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <ArrowUpFromLine className="h-3 w-3 mr-2" />}
                  Exportar
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Outlook */}
            <div className="flex items-center justify-between p-4 border border-border bg-muted/5 opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <span className="font-bold text-blue-500">O</span>
                </div>
                <div>
                  <p className="font-serif">Outlook</p>
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">Em Breve</p>
                </div>
              </div>
            </div>

            {/* Apple */}
            <div className="flex items-center justify-between p-4 border border-border bg-muted/5 opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 flex items-center justify-center border border-white/20">
                  <span className="font-bold">A</span>
                </div>
                <div>
                  <p className="font-serif">Apple</p>
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">Em Breve</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações por E-mail */}
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
              <Label className="font-mono text-xs uppercase">Ativar notificações por e-mail</Label>
              <p className="text-xs text-muted-foreground">
                Receba resumos diários e alertas importantes
              </p>
            </div>
            <Switch
              checked={notificationSettings.email_enabled}
              onCheckedChange={(checked) =>
                setNotificationSettings({ ...notificationSettings, email_enabled: checked })
              }
            />
          </div>

          {notificationSettings.email_enabled && (
            <>
              <div className="border-t border-border pt-6">
                <Label className="mb-4 block font-mono text-xs uppercase text-muted-foreground">Lembretes Antecipados (Dias)</Label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 5, 7, 14, 30].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleReminderDay(day)}
                      className={`px-4 py-2 text-xs font-mono border transition-colors ${notificationSettings.reminder_days.includes(day)
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
                <Label className="font-mono text-xs uppercase text-muted-foreground mb-4 block">Eventos Gatilho</Label>

                {[
                  { key: 'notify_new_event', label: 'NOVO EVENTO' },
                  { key: 'notify_event_update', label: 'ATUALIZAÇÃO DE EVENTO' },
                  { key: 'notify_event_cancel', label: 'CANCELAMENTO' },
                  { key: 'notify_assistant_assigned', label: 'ASSISTENTE DESIGNADO' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono uppercase">{item.label}</span>
                    </div>
                    <Switch
                      checked={(notificationSettings as any)[item.key]}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, [item.key]: checked })
                      }
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              onClick={saveNotificationSettings}
              disabled={saving}
              className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-widest px-8"
            >
              {saving ? 'SALVANDO...' : 'SALVAR_PREFERÊNCIAS'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
