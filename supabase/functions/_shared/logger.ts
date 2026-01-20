import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface LogEntry {
    level: 'info' | 'warn' | 'error';
    message: string;
    context?: Record<string, any>;
    source?: string;
}

export class Logger {
    private supabaseUrl: string;
    private supabaseKey: string;
    private source: string;

    constructor(source: string) {
        this.source = source;
        this.supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        this.supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    }

    private async log(entry: LogEntry) {
        // Always log to console for immediate visibility in Dashboard logs
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${entry.level.toUpperCase()}] [${this.source}] ${entry.message}`;

        if (entry.level === 'error') {
            console.error(logMessage, entry.context || '');
        } else if (entry.level === 'warn') {
            console.warn(logMessage, entry.context || '');
        } else {
            console.log(logMessage, entry.context || '');
        }

        // Try to log to DB if we have credentials
        if (this.supabaseUrl && this.supabaseKey) {
            try {
                const adminClient = createClient(this.supabaseUrl, this.supabaseKey);

                await adminClient.from('system_logs').insert({
                    level: entry.level,
                    message: entry.message,
                    metadata: entry.context,
                    source: this.source,
                });
            } catch (err) {
                // Fallback if DB logging fails - allow silently as we don't want to crash the app
                console.error('Failed to write log to database:', err);
            }
        }
    }

    async info(message: string, context?: Record<string, any>) {
        await this.log({ level: 'info', message, context });
    }

    async warn(message: string, context?: Record<string, any>) {
        await this.log({ level: 'warn', message, context });
    }

    async error(message: string, context?: Record<string, any>) {
        await this.log({ level: 'error', message, context });
    }
}
