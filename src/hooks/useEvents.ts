
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface Event {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_type?: string | null;
    start_time: string | null;
    end_time: string | null;
    arrival_time?: string | null;
    making_of_time?: string | null;
    ceremony_time?: string | null;
    advisory_time?: string | null;
    location: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    notes?: string | null;
    color: string;
    client_id?: string | null;
    project_id?: string | null;
    reminder_days?: number[];
    client?: { id: string; name: string; phone?: string; email?: string } | null;
    project?: { name: string } | null;
    assistants?: { id: string; name: string }[];
    total_value?: number;
    payment_method?: string;
    payment_status?: 'pending' | 'paid';
    google_calendar_event_id?: string | null;
}

export const useEvents = (start: Date, end: Date) => {
    return useQuery({
        queryKey: ['events', format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('events')
                .select(`
          *,
          project:projects(name),
          client:wedding_clients(id, name, phone, email),
          event_assistants(
            assistant:assistants(id, name)
          )
        `)
                .gte('event_date', format(start, 'yyyy-MM-dd'))
                .lte('event_date', format(end, 'yyyy-MM-dd'))
                .order('event_date', { ascending: true });

            if (error) {
                throw error;
            }

            // Transform to match local Event interface
            return (data || []).map((event) => ({
                ...event,
                client: Array.isArray(event.client) ? event.client[0] : event.client,
                project: Array.isArray(event.project) ? event.project[0] : event.project,
                assistants: event.event_assistants?.map((ea: any) => ea.assistant) || [],
                reminder_days: typeof event.reminder_days === 'string'
                    ? JSON.parse(event.reminder_days)
                    : (event.reminder_days || [])
            })) as Event[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
