import { supabase } from '@/integrations/supabase/client';
import { CalendarDatabase, CalendarEventDB, ProjectDB } from '@/types/calendar';
import { SupabaseClient } from '@supabase/supabase-js';

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
        // Cast supabase client to use our extended database types
        const typedSupabase = supabase as unknown as SupabaseClient<CalendarDatabase>;

        // 1. Check Google Connection (using new table)
        const { data: tokenData } = await typedSupabase
            .from('google_calendar_tokens')
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
            const { data: projectsData } = await (supabase
                .from('projects') as any)
                .select('*, client:wedding_clients(full_name)')
                .eq('user_id', userId)
                .gte('event_date', today.toISOString().split('T')[0])
                .order('event_date', { ascending: true })
                .limit(5);

            // Cast to unknown first to avoid "excessively deep" error, then to our shape
            const projects = projectsData as unknown as (ProjectDB & { client: { full_name: string } | { full_name: string }[] | null })[];

            const projectEvents: DashboardEvent[] = (projects || []).map((p) => {
                const clientName = Array.isArray(p.client) ? p.client[0]?.full_name : p.client?.full_name;
                return {
                    id: p.id,
                    title: clientName || 'Projeto',
                    date: p.event_date,
                    time: p.event_time?.slice(0, 5),
                    type: 'project',
                    clientName: clientName
                };
            });

            // 3. Fetch Google Events (from local sync table)
            // We rely on the sync mechanism to have populated this
            const { data: googleEventsData } = await typedSupabase
                .from('calendar_events')
                .select('*')
                .eq('user_id', userId)
                .eq('event_type', 'personal')
                .gte('start_time', today.toISOString())
                .order('start_time', { ascending: true })
                .limit(5);

            const googleEvents = googleEventsData as unknown as CalendarEventDB[];

            const externalEvents: DashboardEvent[] = (googleEvents || []).map((e) => ({
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
