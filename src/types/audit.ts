import { Database, Json } from '@/types/supabase';

export interface SystemLog {
    id: string;
    timestamp: string | null;
    level: string | null;
    severity: string | null;
    message: string | null;
    user_id: string | null;
}

export interface AuditLog {
    id: string;
    user_id: string | null;
    table_name: string;
    record_id: string;
    action: string;
    source: string | null;
    old_data: Json | null;
    new_data: Json | null;
    created_at: string;
}

export interface NotificationLog {
    id: string;
    created_at: string;
    status: string | null;
    error_message: string | null;
    recipient: string | null;
    type: string | null;
    provider_id: string | null;
    metadata: Json | null;
}

// Extended Database type to include tables that might be missing from codegen
export type AuditDatabase = Database & {
    public: {
        Tables: {
            system_logs: {
                Row: SystemLog;
                Insert: Omit<SystemLog, 'id'>;
                Update: Partial<Omit<SystemLog, 'id'>>;
                Relationships: [];
            };
            audit_logs: {
                Row: AuditLog;
                Insert: Omit<AuditLog, 'id'>;
                Update: Partial<Omit<AuditLog, 'id'>>;
                Relationships: [];
            };
            notification_logs: {
                Row: NotificationLog;
                Insert: Omit<NotificationLog, 'id'>;
                Update: Partial<Omit<NotificationLog, 'id'>>;
                Relationships: [];
            };
        }
    }
};
