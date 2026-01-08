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
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

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

  const connectCalendar = (provider: 'google' | 'outlook' | 'apple') => {
    // URLs OAuth para cada provedor
    const oauthUrls: Record<string, string> = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
        client_id: 'YOUR_GOOGLE_CLIENT_ID', // Será configurado pelo usuário
        redirect_uri: `${window.location.origin}/auth/callback/google`,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/calendar',
        access_type: 'offline',
        prompt: 'consent',
        state: user!.id
      }).toString(),
      outlook: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' + new URLSearchParams({
        client_id: 'YOUR_OUTLOOK_CLIENT_ID',
        redirect_uri: `${window.location.origin}/auth/callback/outlook`,
        response_type: 'code',
        scope: 'https://graph.microsoft.com/Calendars.ReadWrite offline_access',
        state: user!.id
      }).toString(),
      apple: '#' // Apple Calendar não tem API OAuth pública padrão
    };

    // Por enquanto, mostra mensagem informativa
    toast({
      title: "Integração em desenvolvimento",
      description: `A integração com ${provider === 'google' ? 'Google Calendar' : provider === 'outlook' ? 'Outlook' : 'Apple Calendar'} requer configuração OAuth. Entre em contato para habilitar.`
    });
  };

  const disconnectCalendar = async (integrationId: string) => {
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

  return (
    <div className="space-y-6">
      {/* Integrações de Calendário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Sincronização de Calendário
          </CardTitle>
          <CardDescription>
            Conecte sua agenda para sincronizar automaticamente todos os eventos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Calendar */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium">Google Calendar</p>
                {getIntegrationByProvider('google') ? (
                  <Badge variant="default" className="bg-green-500">
                    <Check className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">Não conectado</p>
                )}
              </div>
            </div>
            {getIntegrationByProvider('google') ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => disconnectCalendar(getIntegrationByProvider('google')!.id)}
              >
                <X className="h-4 w-4 mr-1" />
                Desconectar
              </Button>
            ) : (
              <Button onClick={() => connectCalendar('google')}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Conectar
              </Button>
            )}
          </div>

          {/* Outlook */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.157.152-.355.228-.594.228h-8.456v-6.182l1.267.95c.086.072.19.108.312.108.122 0 .226-.036.312-.108l6.585-4.934c.17-.134.26-.308.26-.52 0-.17-.072-.32-.217-.45-.144-.128-.31-.193-.5-.193h-.26l-7.572 5.68-2.024-1.518V5.545h8.456c.24 0 .437.076.594.228.157.152.237.345.237.576v1.038zM0 7.387v10.478c0 .23.08.424.238.576.157.152.355.228.594.228h8.456V8.273L6.71 6.518c-.085-.073-.19-.11-.312-.11-.122 0-.226.037-.312.11L0 11.453c-.17.134-.26.308-.26.52 0 .17.072.32.217.45.144.128.31.193.5.193h.26L8.288 6.936v4.337L0 17.091V7.387zm0-1.842V4.507c0-.23.08-.424.238-.576C.395 3.78.593 3.704.832 3.704H23.168c.24 0 .437.076.594.227.157.152.237.346.237.576v1.038L12 12.227 0 5.545z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium">Outlook Calendar</p>
                {getIntegrationByProvider('outlook') ? (
                  <Badge variant="default" className="bg-green-500">
                    <Check className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">Não conectado</p>
                )}
              </div>
            </div>
            {getIntegrationByProvider('outlook') ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => disconnectCalendar(getIntegrationByProvider('outlook')!.id)}
              >
                <X className="h-4 w-4 mr-1" />
                Desconectar
              </Button>
            ) : (
              <Button onClick={() => connectCalendar('outlook')}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Conectar
              </Button>
            )}
          </div>

          {/* Apple Calendar */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path fill="#000" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium">Apple Calendar</p>
                {getIntegrationByProvider('apple') ? (
                  <Badge variant="default" className="bg-green-500">
                    <Check className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">Não conectado</p>
                )}
              </div>
            </div>
            {getIntegrationByProvider('apple') ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => disconnectCalendar(getIntegrationByProvider('apple')!.id)}
              >
                <X className="h-4 w-4 mr-1" />
                Desconectar
              </Button>
            ) : (
              <Button onClick={() => connectCalendar('apple')}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Conectar
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Ao conectar, todos os novos eventos serão sincronizados automaticamente com seu calendário.
          </p>
        </CardContent>
      </Card>

      {/* Notificações por E-mail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notificações por E-mail
          </CardTitle>
          <CardDescription>
            Configure lembretes e notificações automáticas por e-mail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar notificações por e-mail</Label>
              <p className="text-sm text-muted-foreground">
                Receba e-mails sobre seus eventos e projetos
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
              <div className="border-t pt-4">
                <Label className="mb-3 block">Lembretes de Eventos</Label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 5, 7, 14, 30].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleReminderDay(day)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        notificationSettings.reminder_days.includes(day)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {day === 1 ? '1 dia' : `${day} dias`}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Você receberá lembretes nos dias selecionados antes de cada evento
                </p>
              </div>

              <div className="border-t pt-4 space-y-4">
                <Label>Tipos de Notificação</Label>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Novo evento criado</span>
                  </div>
                  <Switch
                    checked={notificationSettings.notify_new_event}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, notify_new_event: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Evento atualizado</span>
                  </div>
                  <Switch
                    checked={notificationSettings.notify_event_update}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, notify_event_update: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Evento cancelado</span>
                  </div>
                  <Switch
                    checked={notificationSettings.notify_event_cancel}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, notify_event_cancel: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Assistente designado</span>
                  </div>
                  <Switch
                    checked={notificationSettings.notify_assistant_assigned}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, notify_assistant_assigned: checked })
                    }
                  />
                </div>
              </div>
            </>
          )}

          <Button onClick={saveNotificationSettings} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
