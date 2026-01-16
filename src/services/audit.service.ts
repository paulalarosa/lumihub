// Audit service - disabled due to missing table
// This service is stubbed until backup_integrity_logs table is created

export interface AuditLog {
    id: string;
    action: string;
    details: any;
    admin_email: string;
    checksum: string;
    created_at: string;
}

export const AuditService = {
    async logAction(action: string, details: any): Promise<void> {
        // Temporarily disabled - table doesn't exist
        console.log('[Audit] Action:', action, details);
    },

    async getLogs(page = 0, limit = 20): Promise<{ data: AuditLog[], count: number }> {
        // Return empty for now
        return {
            data: [],
            count: 0
        };
    }
};
