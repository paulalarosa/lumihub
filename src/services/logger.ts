import { supabase } from "@/integrations/supabase/client";
import { Database, Json } from "@/integrations/supabase/types";
import { SupabaseClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/react";

// Safe console fallback for environments where console might be stripped
const safeConsole = {
    log: console.log ? console.log.bind(console) : () => { },
    error: console.error ? console.error.bind(console) : () => { },
    warn: console.warn ? console.warn.bind(console) : () => { },
};

type LogLevel = 'info' | 'error' | 'warning' | 'fatal';

interface LogMetadata {
    [key: string]: unknown;
}

// Extend the Database definition to include system_logs if it's missing from the generated types
// or use it directly if it exists. 
// For now, we assume it might be missing or we want to be explicit.
type LocalDatabase = Database & {
    public: {
        Tables: {
            system_logs: {
                Row: {
                    id: string;
                    level: string | null;
                    severity: string | null;
                    message: string | null;
                    user_id: string | null;
                    metadata: Json | null;
                    timestamp: string | null;
                };
                Insert: {
                    id?: string;
                    level?: string | null;
                    severity?: string | null;
                    message?: string | null;
                    user_id?: string | null;
                    metadata?: Json | null;
                    timestamp?: string | null;
                };
                Update: {
                    id?: string;
                    level?: string | null;
                    severity?: string | null;
                    message?: string | null;
                    user_id?: string | null;
                    metadata?: Json | null;
                    timestamp?: string | null;
                };
                Relationships: [];
            },
            audit_logs: {
                Row: {
                    id: string;
                    user_id: string | null;
                    table_name: string;
                    record_id: string;
                    action: string;
                    source: string | null;
                    old_data: Json | null;
                    new_data: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    table_name: string;
                    record_id?: string;
                    action: string;
                    source?: string | null;
                    old_data?: Json | null;
                    new_data?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    table_name: string;
                    record_id?: string;
                    action: string;
                    source?: string | null;
                    old_data?: Json | null;
                    new_data?: Json | null;
                    created_at?: string;
                };
                Relationships: [];
            }
        }
    }
};

export class Logger {
    private static isDev = import.meta.env.DEV;

    /**
     * Set the audit source for the current session at the database level.
     * Use this when performing specific operations like 'API_SYNC' or 'MIGRATION'.
     */
    static async setSessionSource(source: string) {
        if (this.isDev) {
            safeConsole.log(`[LOGGER] Setting session audit source: ${source}`);
        }

        // Use the custom RPC helper from Phase 20
        // We cast to any to bypass generated type limitations for new functions
        const { error } = await (supabase.rpc as any)('set_audit_source', {
            source_text: source
        });

        if (error && this.isDev) {
            safeConsole.error("Failed to set session source:", error);
        }
    }

    /**
     * Log informational messages.
     * In prod, sends to Supabase 'system_logs' with severity 'info'.
     */
    static async info(message: string, userId: string = 'SYSTEM', metadata?: LogMetadata) {
        if (this.isDev) {
            safeConsole.log(`[INFO] ${message}`, metadata || '');
        }

        this.persistLog('info', message, userId, metadata);
    }

    /**
     * Log warnings.
     * In prod, sends to Supabase 'system_logs' with severity 'warning'.
     */
    static async warning(message: string, userId: string = 'SYSTEM', metadata?: LogMetadata) {
        if (this.isDev) {
            safeConsole.warn(`[WARN] ${message}`, metadata || '');
        }
        this.persistLog('warning', message, userId, metadata);
    }

    /**
     * Log errors.
     * In prod, sends to Supabase 'system_logs' with severity 'error'.
     * Tries to capture stack trace if errorObj is provided.
     */
    static async error(message: string, errorObj?: unknown, userId: string = 'SYSTEM', metadata?: LogMetadata) {
        if (this.isDev) {
            safeConsole.error(`[ERROR] ${message}`, errorObj || '', metadata || '');
        }

        const effectiveMetadata = {
            ...metadata,
            stack: errorObj instanceof Error ? errorObj.stack : (new Error().stack),
            originalError: errorObj instanceof Error ? errorObj.message : String(errorObj),
            environment: this.isDev ? 'development' : 'production'
        };

        // Report to Sentry if available
        if (errorObj instanceof Error) {
            Sentry.captureException(errorObj, {
                extra: { message, ...metadata },
                user: userId !== 'SYSTEM' ? { id: userId } : undefined
            });
        } else {
            Sentry.captureMessage(message, {
                level: 'error',
                extra: { ...metadata, originalError: String(errorObj) }
            });
        }

        // Enforce CRITICAL level for errors in persistLog
        this.persistLog('error', message, userId, effectiveMetadata);
    }

    /**
     * Log audit actions (critical user operations).
     * Directly persists to 'audit_logs' table.
     */
    static async action(
        actionName: string,
        userId: string,
        tableName: string = 'APP_ACTION',
        recordId: string = '00000000-0000-0000-0000-000000000000',
        details?: LogMetadata,
        source: string = 'WEB_UI'
    ) {
        if (this.isDev) {
            safeConsole.log(`[AUDIT][${source}] ${actionName} on ${tableName}:${recordId}`, details || '');
        }

        const typedSupabase = supabase as unknown as SupabaseClient<LocalDatabase>;
        const jsonMetadata = details ? JSON.parse(JSON.stringify(details)) : null;

        typedSupabase.from('audit_logs').insert({
            user_id: userId === 'SYSTEM' ? null : userId,
            table_name: tableName,
            record_id: recordId,
            action: actionName.toUpperCase(),
            source: source,
            new_data: jsonMetadata,
            created_at: new Date().toISOString()
        }).then(({ error }) => {
            if (error && this.isDev) {
                safeConsole.error("Failed to write to audit_logs:", error);
            }
        });
    }

    /**
     * Specialized audit log for security-critical events.
     * Prepend SECURITY_ to the action name.
     */
    static async security(
        event: string,
        userId: string,
        tableName: string,
        recordId: string,
        details?: LogMetadata,
        source: string = 'WEB_UI'
    ) {
        return this.action(`SECURITY_${event}`, userId, tableName, recordId, details, source);
    }

    /**
     * Internal method to write to Supabase.
     * Fire-and-forget approach to avoid blocking UI.
     */
    private static async persistLog(severity: LogLevel, message: string, userId: string, metadata?: LogMetadata) {
        // Enforce KONTROL branding on all messages
        const brandedMessage = `KONTROL: ${message}`;

        // Don't await this in the main flow to avoid blocking
        const typedSupabase = supabase as unknown as SupabaseClient<LocalDatabase>;
        const jsonMetadata = metadata ? JSON.parse(JSON.stringify(metadata)) : null;

        typedSupabase.from('system_logs').insert({
            level: severity,
            severity: severity,
            message: brandedMessage,
            user_id: userId === 'SYSTEM' ? null : userId,
            metadata: jsonMetadata,
            timestamp: new Date().toISOString()
        }).then(({ error }) => {
            if (error && this.isDev) {
                safeConsole.error("Failed to write to system_logs:", error);
            }
        });
    }
}
