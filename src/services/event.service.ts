import { supabase } from '@/integrations/supabase/client';
import { getCalendarEvents, GoogleCalendarEvent } from '@/integrations/google/calendar';

export const EventService = {
    async getUpcomingEvents(organizationId: string, userId?: string, role?: string) {
        // 1. Check Google Connection (only for admins/owners)
        let googleConnected = false;
        if (role !== 'assistant') {
            const { data: { session } } = await supabase.auth.getSession();
            googleConnected = !!session?.provider_token;
        }

        let events = [];

        if (googleConnected && role !== 'assistant') {
            try {
                const gEvents = await getCalendarEvents();
                if (gEvents) {
                    // Filter only future events and take top 5
                    events = gEvents.filter(e => {
                        const date = e.start.dateTime || e.start.date;
                        return date ? new Date(date) >= new Date() : false;
                    }).slice(0, 5);
                }
            } catch (e) {
                console.error("Failed to fetch google events", e);
            }
        } else {
            // DB Events
            const today = new Date().toISOString().split('T')[0];

            // Simplified query without complex joins
            const { data: dbEventsData } = await supabase
                .from('events')
                .select('*')
                .eq('user_id', organizationId)
                .gte('event_date', today)
                .order('event_date', { ascending: true })
                .limit(5);

            events = dbEventsData || [];

        }

        return { events, isGoogleConnected: googleConnected };
    }
};
