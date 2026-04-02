import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface LogEntry {
  level: 'info' | 'warn' | 'error'
  message: string
  context?: Record<string, any>
  source?: string
}

export class Logger {
  private supabaseUrl: string
  private supabaseKey: string
  private source: string

  constructor(source: string) {
    this.source = source
    this.supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    this.supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  }

  private async log(entry: LogEntry) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${entry.level.toUpperCase()}] [${this.source}] ${entry.message}`

    if (entry.level === 'error') {
    } else if (entry.level === 'warn') {
    } else {
    }

    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const adminClient = createClient(this.supabaseUrl, this.supabaseKey)

        await adminClient.from('system_logs').insert({
          level: entry.level,
          message: entry.message,
          metadata: entry.context,
          source: this.source,
        })
      } catch (err) {}
    }
  }

  async info(message: string, context?: Record<string, any>) {
    await this.log({ level: 'info', message, context })
  }

  async warn(message: string, context?: Record<string, any>) {
    await this.log({ level: 'warn', message, context })
  }

  async error(message: string, context?: Record<string, any>) {
    await this.log({ level: 'error', message, context })
  }
}
