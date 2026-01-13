
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
            }
            throw new Error(`Google Calendar API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Error fetching Google Calendar events:", error);
        return [];
    }
};
