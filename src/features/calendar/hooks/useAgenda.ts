
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCalendarEvents, GoogleCalendarEvent } from "@/integrations/google/calendar";
import { format } from "date-fns";
import { useEvents, Event } from "@/hooks/useEvents";

// Re-export Event type or define here
export type { Event };

export const useAgenda = (startDate: Date, endDate: Date) => {
    // 1. Fetch Assistants
    const assistantsQuery = useQuery({
        queryKey: ['assistants'],
        queryFn: async () => {
            const { data, error } = await supabase.from('assistants').select('*').order('name');
            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 30, // 30 mins
    });

    // 2. Fetch Google Events
    // Note: getCalendarEvents usually fetches a broad range or default. 
    // If it accepts params, pass them. Assuming strict logic from original file for now.
    const googleEventsQuery = useQuery({
        queryKey: ['google-events'],
        queryFn: async () => {
            const gEvents = await getCalendarEvents();
            // Map Google Events
            return gEvents.map((gEvent: GoogleCalendarEvent) => {
                const start = gEvent.start.dateTime || gEvent.start.date || new Date().toISOString();
                const end = gEvent.end.dateTime || gEvent.end.date || new Date().toISOString();
                const startDate = new Date(start);
                return {
                    id: gEvent.id,
                    title: gEvent.summary || '(Sem título)',
                    description: gEvent.description || null,
                    event_date: format(startDate, 'yyyy-MM-dd'),
                    event_type: 'google',
                    start_time: gEvent.start.dateTime ? format(startDate, 'HH:mm') : null,
                    end_time: gEvent.end.dateTime ? format(new Date(end), 'HH:mm') : null,
                    location: gEvent.location || null,
                    address: gEvent.location || null,
                    notes: gEvent.htmlLink,
                    color: '#FFFFFF',
                    client_id: null,
                    project_id: null,
                    client: { id: 'google', name: 'Google Agenda' },
                    project: null,
                    assistants: [],
                    total_value: 0
                } as Event;
            });
        },
        staleTime: 1000 * 60 * 5, // 5 mins
    });

    // 3. Supabase Events (Reusing useEvents hook logic would be ideal if it uses Query, 
    // but looking at imports, useEvents might be a custom hook using manual fetch or Query? 
    // The original file used `useEvents(fetchStart, fetchEnd)`. 
    // I will assume it returns { data, isLoading, refetch }. 
    // I will just parallelize it here by Composing or wrapping if I can access useEvents internals.
    // Actually, I can just call useEvents in the component and pass data into this hook, 
    // or duplicate the query here. 
    // It's cleaner to keep Supabase logic separate if useEvents is well written. 
    // But for "Merging", we need both. 
    // Let's implement the merge logic as a pure function or memo inside the Component 
    // OR export a merging hook. 
    // For `useAgenda`, I will focus on the missing pieces: Assistants and Google.

    return {
        assistants: assistantsQuery.data || [],
        googleEvents: googleEventsQuery.data || [],
        isLoadingAssistants: assistantsQuery.isLoading,
        isLoadingGoogle: googleEventsQuery.isLoading,
        refetchGoogle: googleEventsQuery.refetch,
        refetchAssistants: assistantsQuery.refetch
    };
};
