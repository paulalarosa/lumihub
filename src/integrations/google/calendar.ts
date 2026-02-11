
import { supabase } from '@/integrations/supabase/client';

export interface GoogleCalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
    };
    location?: string;
    htmlLink: string;
}

export const getCalendarEvents = async (): Promise<GoogleCalendarEvent[]> => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.provider_token) {
        console.warn("No provider token found in session. User might not be logged in with Google or scope is missing.");
        return [];
    }

    try {
        const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + new Date().toISOString() + '&singleEvents=true&orderBy=startTime&maxResults=50',
            {
                headers: {
                    'Authorization': `Bearer ${session.provider_token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                // Token might be expired or invalid
                console.error("Google Calendar API Unauthorized. Token might be expired.");
                throw new Error("Sessão expirada. Faça login novamente.");
            }
            if (response.status === 403) {
                console.error("Google Calendar API Forbidden.");
                throw new Error("Acesso à agenda negado. Por favor, refaça o login com Google e autorize as permissões de calendário.");
            }
            throw new Error(`Google Calendar API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const items = data.items || [];

        // Deduplication Logic
        const uniqueEvents = [...new Map(items.map(item => [item.id, item])).values()];

        return uniqueEvents as GoogleCalendarEvent[];
    } catch (error) {
        console.error("Error fetching Google Calendar events:", error);
        return [];
    }
};

export const deleteCalendarEvent = async (googleEventId: string): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.provider_token) {
        console.warn("No provider token found.");
        return false;
    }

    try {
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.provider_token}`,
                }
            }
        );

        if (!response.ok) {
            // 410 Gone means it's already deleted, which counts as success
            if (response.status === 410) return true;
            console.error(`Google Calendar Delete Error: ${response.statusText}`);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error deleting Google Calendar event:", error);
        return false;
    }
};
