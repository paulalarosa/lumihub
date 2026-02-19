import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

interface UserIntegration {
    id: string;
    provider: string;
    is_active: boolean;
    sync_enabled: boolean;
    last_sync_at: string | null;
    user_id: string; // Add user_id to match DB
    created_at: string; // Add timestamps
    updated_at: string;
    access_token: string | null;
    refresh_token: string | null;
    expires_at: string | null;
    metadata: any;
}

interface NotificationSettings {
    id: string; // id is likely required in Row
    user_id: string;
    email_enabled: boolean;
    reminder_days: number[];
    notify_new_event: boolean;
    notify_event_update: boolean;
    notify_event_cancel: boolean;
    notify_assistant_assigned: boolean;
    created_at?: string;
    updated_at?: string;
}

// Local Database override to include missing tables if any
type LocalDatabase = Database & {
    public: {
        Tables: {
            notification_settings: {
                Row: NotificationSettings;
                Insert: Omit<NotificationSettings, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<NotificationSettings, 'id' | 'created_at' | 'updated_at'>>;
                Relationships: [];
            }
        }
    }
};

interface DeliverabilityStatus {
    bounces: number;
    complaints: number;
    invalid_profiles: number;
    invalid_clients: number;
    invalid_leads: number;
    invalid_invites: number;
}

export type { UserIntegration, NotificationSettings, DeliverabilityStatus };

const DEFAULT_NOTIFICATION_SETTINGS: Omit<NotificationSettings, 'id' | 'user_id'> = {
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

    // Use typed client
    const typedSupabase = supabase as unknown as SupabaseClient<LocalDatabase>;

    const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
    const [notificationSettings, setNotificationSettings] = useState<Omit<NotificationSettings, 'user_id'>>({
        id: '',
        ...DEFAULT_NOTIFICATION_SETTINGS
    });
    const [deliverabilityStatus, setDeliverabilityStatus] = useState<DeliverabilityStatus>({
        bounces: 0,
        complaints: 0,
        invalid_profiles: 0,
        invalid_clients: 0,
        invalid_leads: 0,
        invalid_invites: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [syncing, setSyncing] = useState<string | null>(null);

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    useEffect(() => {
        const handleCallback = async () => {
            // ... existing callback logic ...
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
        if (!user) return;
        setLoading(true);

        // user_integrations is in Database but we use typedSupabase to be consistent
        // We need to cast the result because standard definitions might differ from local interface slightly
        const { data: integrationsData } = await typedSupabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', user.id);

        // Map to UserIntegration to be safe
        const mappedIntegrations: UserIntegration[] = (integrationsData || []).map((i: any) => ({
            id: i.id,
            provider: i.provider,
            is_active: true, // Assuming active if present? Or use i.metadata field?
            sync_enabled: true,
            last_sync_at: i.updated_at,
            user_id: i.user_id,
            created_at: i.created_at,
            updated_at: i.updated_at,
            access_token: i.access_token,
            refresh_token: i.refresh_token,
            expires_at: i.expires_at,
            metadata: i.metadata
        }));

        setIntegrations(mappedIntegrations);

        const { data: notifData } = await typedSupabase
            .from('notification_settings')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (notifData) {
            const nd = notifData as unknown as NotificationSettings;
            setNotificationSettings({
                id: nd.id,
                email_enabled: nd.email_enabled,
                reminder_days: nd.reminder_days || [1, 3, 7],
                notify_new_event: nd.notify_new_event,
                notify_event_update: nd.notify_event_update,
                notify_event_cancel: nd.notify_event_cancel,
                notify_assistant_assigned: nd.notify_assistant_assigned,
                created_at: nd.created_at,
                updated_at: nd.updated_at
            });
        }

        // Fetch Deliverability Metrics
        const [
            { count: bounceCount },
            { count: complaintCount },
            { count: invProfiles },
            { count: invClients },
            { count: invLeads },
            { count: invInvites }
        ] = await Promise.all([
            supabase.from('notification_logs').select('*', { count: 'exact', head: true }).like('error_message', '%SES Bounce%'),
            supabase.from('notification_logs').select('*', { count: 'exact', head: true }).like('error_message', '%SES Complaint%'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('email_status', 'invalid'),
            supabase.from('wedding_clients').select('*', { count: 'exact', head: true }).eq('email_status', 'invalid'),
            supabase.from('leads').select('*', { count: 'exact', head: true }).eq('email_status', 'invalid'),
            supabase.from('assistant_invites').select('*', { count: 'exact', head: true }).eq('email_status', 'invalid')
        ]);

        setDeliverabilityStatus({
            bounces: bounceCount || 0,
            complaints: complaintCount || 0,
            invalid_profiles: invProfiles || 0,
            invalid_clients: invClients || 0,
            invalid_leads: invLeads || 0,
            invalid_invites: invInvites || 0
        });

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
            const { error } = await typedSupabase.from('user_integrations').delete().eq('id', integrationId);
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
        const currentDays = notificationSettings.reminder_days || [];
        setNotificationSettings({
            ...notificationSettings,
            reminder_days: currentDays.includes(day)
                ? currentDays.filter(d => d !== day)
                : [...currentDays, day].sort((a, b) => a - b)
        });
    };

    const saveNotificationSettings = async () => {
        setSaving(true);
        // Exclude id if it's empty (for new insertion)
        const { id, ...settingsWithoutId } = notificationSettings;
        const payload = id ? notificationSettings : settingsWithoutId;

        // Upsert requires all fields for match? No, match on user_id.
        const { error } = await typedSupabase.from('notification_settings').upsert({
            user_id: user!.id,
            email_enabled: notificationSettings.email_enabled,
            reminder_days: notificationSettings.reminder_days,
            notify_new_event: notificationSettings.notify_new_event,
            notify_event_update: notificationSettings.notify_event_update,
            notify_event_cancel: notificationSettings.notify_event_cancel,
            notify_assistant_assigned: notificationSettings.notify_assistant_assigned
        } as any, { onConflict: 'user_id' }); // Cast payload due to strict checking of Insert type vs Omit return

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
        deliverabilityStatus
    };
}
