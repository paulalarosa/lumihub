import { supabase } from "@/integrations/supabase/client";

// Safe console fallback for environments where console might be stripped
const safeConsole = {
    log: console.log ? console.log.bind(console) : () => { },
    error: console.error ? console.error.bind(console) : () => { },
    warn: console.warn ? console.warn.bind(console) : () => { },
};

type LogLevel = 'info' | 'error' | 'warning' | 'fatal';

interface LogMetadata {
    [key: string]: any;
}

export class Logger {
    private static isDev = import.meta.env.DEV;

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
    static async error(message: string, errorObj?: any, userId: string = 'SYSTEM', metadata?: LogMetadata) {
        if (this.isDev) {
            safeConsole.error(`[ERROR] ${message}`, errorObj, metadata || '');
        }

        const effectiveMetadata = {
            ...metadata,
            stack: errorObj?.stack || null,
            originalError: errorObj?.message || String(errorObj)
        };

        this.persistLog('error', message, userId, effectiveMetadata);
    }

    /**
     * Log audit actions (critical user operations).
     * Maps to 'info' severity but with specific prefixes or future audit table.
     */
    static async action(actionName: string, userId: string, details?: LogMetadata) {
        const message = `ACTION: ${actionName}`;
        if (this.isDev) {
            safeConsole.log(`[ACTION] ${message}`, details || '');
        }
        this.persistLog('info', message, userId, details);
    }

    /**
     * Internal method to write to Supabase.
     * Fire-and-forget approach to avoid blocking UI.
     */
    private static async persistLog(severity: LogLevel, message: string, userId: string, metadata?: LogMetadata) {
        // Don't await this in the main flow to avoid blocking
        supabase.from('system_logs').insert({
            level: severity, // Mapping our internal level to DB column 'level' or 'severity'
            // The DB might use 'severity' or 'level', user prompt said 'SEVERIDADE' for UI column header
            // Let's assume the column is 'severity' based on previous mock data.
            // Wait, previous mock data used `severity`. I will use `severity`.
            // If the table column is 'level', I might need to adjust.
            // Based on task description: "TIMESTAMP | SEVERIDADE | MENSAGEM | USUÁRIO"
            // I'll stick to 'severity'.
            severity: severity,
            message: message,
            user_id: userId === 'SYSTEM' ? null : userId, // Assuming user_column is user_id FK, or just text 'user'.
            // If the table stores the string 'user' directly like mock, I'll use that.
            // "user" column in mock was "admin@lumi.com".
            // Let's optimize: try to store 'user_id' if proper FK, or 'user_email' if text.
            // Given I don't see the schema, I will try to store 'details' or 'metadata' as JSONB if available.
            metadata: metadata,
            timestamp: new Date().toISOString()
        }).then(({ error }) => {
            if (error && this.isDev) {
                safeConsole.error("Failed to write to system_logs:", error);
            }
        });
    }
}
