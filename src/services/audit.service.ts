import { supabase } from "@/integrations/supabase/client";

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return;

        // Simple checksum simulation (For real integrity, use a crypto hash usually done server-side or signed)
        // Here we just stringify payload + time
        const payload = JSON.stringify(details) + action + new Date().toISOString();
        const checksum = btoa(payload).slice(0, 32); // Simple hash-like string

        const { error } = await supabase
            .from('backup_integrity_logs')
            .insert({
                action,
                details,
                admin_email: user.email,
                checksum
            });

        if (error) {
            console.error("Failed to write audit log", error);
        }
    },

    async getLogs(page = 0, limit = 20): Promise<{ data: AuditLog[], count: number }> {
        const from = page * limit;
        const to = from + limit - 1;

        const { data, count, error } = await supabase
            .from('backup_integrity_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        return {
            data: (data as AuditLog[]) || [],
            count: count || 0
        };
    }
};
