import { Database } from '@/integrations/supabase/types';

export interface CalendarEventDB {
    id: string;
    user_id: string;
    title: string;
    description?: string | null;
    start_time: string;
    end_time: string;
    location?: string | null;
    event_type: 'wedding' | 'social' | 'test' | 'personal' | 'blocked';
    status: 'confirmed' | 'tentative' | 'cancelled';
    project_id?: string | null;
    google_event_id?: string | null;
    google_calendar_id?: string | null;
    is_synced?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface GoogleCalendarTokenDB {
    id: string;
    user_id: string;
    access_token: string;
    refresh_token: string;
    expiry_date: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface ProjectDB {
    id: string;
    event_date: string;
    event_time?: string | null;
    status: string;
    user_id?: string;
    // Relations
    client?: {
        full_name: string;
    } | null;
    // Add other known fields if needed
    service_type?: string;
}

// Extended Database type to include tables that might be missing from codegen
export type CalendarDatabase = Database & {
    public: {
        Tables: {
            calendar_events: {
                Row: CalendarEventDB;
                Insert: Omit<CalendarEventDB, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<CalendarEventDB, 'id'>>;
                Relationships: [];
            };
            google_calendar_tokens: {
                Row: GoogleCalendarTokenDB;
                Insert: Omit<GoogleCalendarTokenDB, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<GoogleCalendarTokenDB, 'id'>>;
                Relationships: [];
            };
        }
    }
};
