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
                // Filter only future events and take top 5
                events = gEvents.filter(e => {
                    const date = e.start.dateTime || e.start.date;
                    return date ? new Date(date) >= new Date() : false;
                }).slice(0, 5);
            } catch (e) {
                console.error("Failed to fetch google events", e);
            }
        } else {
            // DB Events
            const today = new Date().toISOString().split('T')[0];

            let query = supabase
                .from('events')
                .select('*, event_assistants!inner(assistant_id)') // Join to filter if needed
                .eq('user_id', organizationId) // Organization events
                .gte('event_date', today)
                .order('event_date', { ascending: true })
                .limit(5);

            if (role === 'assistant' && userId) {
                // 1. Get assistant ID
                const { data: assistantData } = await supabase
                    .from('assistants')
                    .select('id')
                    .eq('user_id', userId)
                    .single();

                if (assistantData) {
                    // Filter events where this assistant is assigned
                    // We use the inner join on event_assistants
                    query = query.eq('event_assistants.assistant_id', assistantData.id);
                } else {
                    // If assistant not found, return empty
                    return { events: [], isGoogleConnected: false };
                }
            } else {
                // If not assistant, remove the !inner join constraint to show all events?
                // Actually if we select event_assistants!inner, it implies ONLY events with assistants.
                // We should change the query based on role.
                query = supabase
                    .from('events')
                    .select('*')
                    .eq('user_id', organizationId)
                    .gte('event_date', today)
                    .order('event_date', { ascending: true })
                    .limit(5);
            }

            const { data: dbEvents } = await query;
            events = (dbEvents as any[]) || [];
        }

        return { events, isGoogleConnected: googleConnected };
    }
};
