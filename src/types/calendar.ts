
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

export interface ProjectDB {
    id: string;
    event_date: string;
    event_time?: string | null;
    status: string;
    client_id?: string;
    // Relations
    clients?: {
        name: string;
    } | null;
    // Add other known fields if needed
    service_type?: string; // We might need to handle this if it's missing
}
