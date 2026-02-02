import { supabase } from "@/integrations/supabase/client";

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
    static async error(message: string, errorObj?: unknown, userId: string = 'SYSTEM', metadata?: LogMetadata) {
        if (this.isDev) {
            safeConsole.error(`[ERROR] ${message}`, errorObj, metadata || '');
        }

        const effectiveMetadata = {
            ...metadata,
            stack: errorObj instanceof Error ? errorObj.stack : null,
            originalError: errorObj instanceof Error ? errorObj.message : String(errorObj)
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
        // @ts-ignore - 'system_logs' table is not yet in the generated types
        supabase.from('system_logs').insert({
            level: severity,
            severity: severity,
            message: message,
            user_id: userId === 'SYSTEM' ? null : userId,
            metadata: metadata as any, // Supabase expects Json, unknown needs casting or verifying
            timestamp: new Date().toISOString()
        }).then(({ error }) => {
            if (error && this.isDev) {
                safeConsole.error("Failed to write to system_logs:", error);
            }
        });
    }
}
