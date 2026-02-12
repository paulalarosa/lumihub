import { supabase } from '@/integrations/supabase/client';
import { CalendarEventDB, ProjectDB } from '@/types/calendar';

export interface DashboardEvent {
    id: string;
    title: string;
    date: string; // ISO string
    time?: string;
    type: 'google' | 'project' | 'internal';
    clientName?: string;
}

export const EventService = {
    async getUpcomingEvents(organizationId: string, userId: string, role?: string) {
        // 1. Check Google Connection (using new table)
        const { data: tokenData } = await supabase
            .from('google_calendar_tokens' as any)
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        const isGoogleConnected = !!tokenData;

        let dashboardEvents: DashboardEvent[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
            // 2. Fetch Projects (Internal)
            // Fetch projects where the user is the makeup artist
            const { data: projects } = await supabase
                .from('projects')
                .select('*, clients(name)')
                .eq('makeup_artist_id', userId)
                .gte('event_date', today.toISOString().split('T')[0])
                .order('event_date', { ascending: true })
                .limit(5);

            const projectEvents: DashboardEvent[] = (projects || []).map((p: any) => ({
                id: p.id,
                title: p.clients?.name || 'Projeto',
                date: p.event_date,
                time: p.event_time?.slice(0, 5),
                type: 'project',
                clientName: p.clients?.name
            }));

            // 3. Fetch Google Events (from local sync table)
            // We rely on the sync mechanism to have populated this
            const { data: googleEvents } = await supabase
                .from('calendar_events' as any)
                .select('*')
                .eq('user_id', userId)
                .eq('event_type', 'personal')
                .gte('start_time', today.toISOString())
                .order('start_time', { ascending: true })
                .limit(5);

            const externalEvents: DashboardEvent[] = (googleEvents || []).map((e: any) => ({
                id: e.id,
                title: e.title,
                date: e.start_time, // ISO
                time: new Date(e.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                type: 'google'
            }));

            // Merge and Sort
            dashboardEvents = [...projectEvents, ...externalEvents].sort((a, b) => {
                const dateA = new Date(a.date + (a.time ? 'T' + a.time : ''));
                const dateB = new Date(b.date + (b.time ? 'T' + b.time : ''));
                return dateA.getTime() - dateB.getTime();
            }).slice(0, 5);

        } catch (e) {
            console.error("Failed to fetch dashboard events", e);
        }

        return { events: dashboardEvents, isGoogleConnected };
    }
};
