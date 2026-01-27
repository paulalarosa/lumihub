import { supabase } from '@/integrations/supabase/client';

// Audit service - disabled due to missing table
// This service is stubbed until backup_integrity_logs table is created

export interface AuditLog {
    id: string;
    action: string;
    details: Record<string, unknown>;
    admin_email: string;
    checksum: string;
    created_at: string;
}

export const AuditService = {
    async logAction(action: string, details: Record<string, unknown>): Promise<void> {
        try {
            // Get current user for audit log
            const { data: { user } } = await supabase.auth.getUser();

            // Calculate simple checksum (mock)
            const checksum = btoa(JSON.stringify(details)).substring(0, 20);

            // @ts-ignore - 'backup_integrity_logs' table is not yet in the generated types
            await supabase.from('backup_integrity_logs').insert({
                action,
                details: details as any, // Cast to any for Supabase JSONB
                checksum,
                user_id: user?.id || 'system' // Use system if no user (e.g. background job), providing constraint allows it or handle error
            });
        } catch (error) {
            console.error('[Audit] Failed to log:', error);
        }
    },

    async getLogs(page = 0, limit = 20): Promise<{ data: AuditLog[], count: number }> {
        // Return empty for now
        return {
            data: [],
            count: 0
        };
    }
};
