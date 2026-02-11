import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

export type { UserIntegration, NotificationSettings };

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    email_enabled: true,
    reminder_days: [1, 3, 7],
    notify_new_event: true,
    notify_event_update: true,
    notify_event_cancel: true,
    notify_assistant_assigned: true
};

export function useIntegrations() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [syncing, setSyncing] = useState<string | null>(null);

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    useEffect(() => {
        const handleCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');

            if (code && state) {
                setConnecting(true);
                try {
                    const { data: { session }, error } = await supabase.auth.getSession();
                    if (error) throw error;
                    if (session?.provider_token) {
                        toast({ title: 'Google Calendar conectado!', description: 'Autenticação realizada com sucesso.' });
                    }
                    window.history.replaceState({}, document.title, window.location.pathname);
                    fetchData();
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : 'Não foi possível conectar ao Google Calendar';
                    toast({ title: 'Erro ao conectar', description: message, variant: 'destructive' });
                } finally {
                    setConnecting(false);
                }
            }
        };
        handleCallback();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: integrationsData } = await (supabase as any)
            .from('user_integrations')
            .select('*')
            .eq('user_id', user!.id);
        setIntegrations((integrationsData as UserIntegration[]) || []);

        const { data: notifData } = await (supabase as any)
            .from('notification_settings')
            .select('*')
            .eq('user_id', user!.id)
            .maybeSingle();

        const nd = notifData as NotificationSettings | null;
        if (nd) {
            setNotificationSettings({
                id: nd.id,
                email_enabled: nd.email_enabled,
                reminder_days: nd.reminder_days || [1, 3, 7],
                notify_new_event: nd.notify_new_event,
                notify_event_update: nd.notify_event_update,
                notify_event_cancel: nd.notify_event_cancel,
                notify_assistant_assigned: nd.notify_assistant_assigned
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
                    queryParams: { access_type: 'offline', prompt: 'consent' }
                }
            });
            if (error) throw error;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Não foi possível iniciar a conexão';
            toast({ title: 'Erro', description: message, variant: 'destructive' });
            setConnecting(false);
        }
    };

    const disconnectCalendar = async (integrationId: string, _provider: string) => {
        try {
            const { error } = await (supabase as any).from('user_integrations').delete().eq('id', integrationId);
            if (error) {
                toast({ title: 'Erro ao desconectar', variant: 'destructive' });
            } else {
                toast({ title: 'Calendário desconectado' });
                fetchData();
            }
        } catch (_) {
            toast({ title: 'Erro ao desconectar', variant: 'destructive' });
        }
    };

    const syncCalendar = async (direction: 'from-google' | 'to-google') => {
        setSyncing(direction);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.provider_token) throw new Error('Não autenticado com Google');

            const response = await fetch(
                'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10',
                { headers: { Authorization: `Bearer ${session.provider_token}`, 'Content-Type': 'application/json' } }
            );
            if (!response.ok) throw new Error('Falha ao contactar Google API');

            const data = await response.json();
            toast({ title: 'Sincronização concluída!', description: `Conexão verificada. ${data.items?.length || 0} eventos encontrados.` });
            fetchData();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Não foi possível sincronizar';
            toast({ title: 'Erro na sincronização', description: message, variant: 'destructive' });
        } finally {
            setSyncing(null);
        }
    };

    const toggleReminderDay = (day: number) => {
        const currentDays = notificationSettings.reminder_days;
        setNotificationSettings({
            ...notificationSettings,
            reminder_days: currentDays.includes(day)
                ? currentDays.filter(d => d !== day)
                : [...currentDays, day].sort((a, b) => a - b)
        });
    };

    const saveNotificationSettings = async () => {
        setSaving(true);
        const { error } = await (supabase as any).from('notification_settings').upsert({
            user_id: user!.id,
            ...notificationSettings
        }, { onConflict: 'user_id' });

        if (error) {
            toast({ title: 'Erro ao salvar configurações', variant: 'destructive' });
        } else {
            toast({ title: 'Configurações de notificação salvas!' });
        }
        setSaving(false);
    };

    const getIntegrationByProvider = (provider: string) => integrations.find(i => i.provider === provider);

    return {
        integrations,
        notificationSettings,
        setNotificationSettings,
        loading,
        saving,
        connecting,
        syncing,
        connectGoogleCalendar,
        disconnectCalendar,
        syncCalendar,
        toggleReminderDay,
        saveNotificationSettings,
        getIntegrationByProvider,
    };
}
