import { supabase } from '@/integrations/supabase/client'
import { Database, Json } from '@/integrations/supabase/types'
import * as Sentry from '@sentry/react'

// Safe console fallback for environments where console might be stripped
const safeConsole = {
  log: console.log ? console.log.bind(console) : () => {},
  error: console.error ? console.error.bind(console) : () => {},
  warn: console.warn ? console.warn.bind(console) : () => {},
}

type LogLevel = 'info' | 'error' | 'warning' | 'fatal'

interface LogMetadata {
  [key: string]: unknown
}

// Extend the Database definition to include system_logs if it's missing from the generated types
// or use it directly if it exists.
// For now, we assume it might be missing or we want to be explicit.
type LocalDatabase = Database & {
  public: {
    Tables: {
      system_logs: {
        Row: {
          id: string
          level: string | null
          severity: string | null
          message: string | null
          user_id: string | null
          metadata: Json | null
          timestamp: string | null
        }
        Insert: {
          id?: string
          level?: string | null
          severity?: string | null
          message?: string | null
          user_id?: string | null
          metadata?: Json | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          level?: string | null
          severity?: string | null
          message?: string | null
          user_id?: string | null
          metadata?: Json | null
          timestamp?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          table_name: string
          record_id: string
          action: string
          source: string | null
          old_data: Json | null
          new_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          table_name: string
          record_id?: string
          action: string
          source?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          table_name: string
          record_id?: string
          action: string
          source?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Functions: {
      set_audit_source: {
        Args: { source_text: string }
        Returns: void
      }
    }
  }
}

export class Logger {
  private static isDev = import.meta.env.DEV

  /**
   * Set the audit source for the current session at the database level.
   * Use this when performing specific operations like 'API_SYNC' or 'MIGRATION'.
   */
  static async setSessionSource(source: string) {
    if (this.isDev) {
      safeConsole.log(`[LOGGER] Setting session audit source: ${source}`)
    }

    // Use the custom RPC helper from Phase 20
    const typedSupabase = supabase
    const { error } = await typedSupabase.rpc('set_audit_source', {
      source_text: source,
    })

    if (error && this.isDev) {
      safeConsole.error('Failed to set session source:', error)
    }
  }

  /**
   * Log debug messages.
   * ONLY logs to console in DEV. Never persists or reports.
   */
  static debug(message: string, ...args: unknown[]) {
    if (this.isDev) {
      safeConsole.log(`[DEBUG] ${message}`, ...args)
    }
  }

  /**
   * Log informational messages.
   * In prod, sends to Supabase 'system_logs' with severity 'info'.
   */
  static async info(
    message: string,
    userId: string = 'SYSTEM',
    metadata?: LogMetadata,
  ) {
    if (this.isDev) {
      safeConsole.log(`[INFO] ${message}`, metadata || '')
    }

    this.persistLog('info', message, userId, metadata)
  }

  /**
   * Log success messages.
   * In prod, sends to Supabase 'system_logs' with severity 'info'.
   */
  static async success(
    message: string,
    userId: string = 'SYSTEM',
    metadata?: LogMetadata,
  ) {
    if (this.isDev) {
      safeConsole.log(`[SUCCESS] ${message}`, metadata || '')
    }

    this.persistLog('info', message, userId, { ...metadata, success: true })
  }

  /**
   * Log warnings.
   * In prod, sends to Supabase 'system_logs' with severity 'warning'.
   */
  static async warning(
    message: string,
    userId: string = 'SYSTEM',
    metadata?: LogMetadata,
  ) {
    if (this.isDev) {
      safeConsole.warn(`[WARN] ${message}`, metadata || '')
    }
    this.persistLog('warning', message, userId, metadata)
  }

  /**
   * Log errors.
   * In prod, sends to Supabase 'system_logs' with severity 'error'.
   * Tries to capture stack trace if errorObj is provided.
   */
  static async error(
    arg1: unknown,
    arg2?: unknown,
    arg3?: unknown,
    arg4?: unknown,
  ) {
    let message = 'Unknown Error'
    let errorObj: unknown = undefined
    let userId = 'SYSTEM'
    let metadata: LogMetadata = {}

    // Detect if first argument is an Error or unknown object
    if (typeof arg1 !== 'string') {
      errorObj = arg1

      if (typeof arg2 === 'string') {
        // logger.error(error, 'Message', ...)
        message = arg2
        if (typeof arg3 === 'object' && arg3 !== null) {
          metadata = arg3 as LogMetadata
          // userId defaults to SYSTEM
        } else if (typeof arg3 === 'string') {
          userId = arg3
          metadata = (arg4 as LogMetadata) || {}
        }
      } else if (typeof arg2 === 'object' && arg2 !== null) {
        // logger.error(error, { message: '...', ...meta })
        const arg2Record = arg2 as Record<string, unknown>
        message =
          (typeof arg2Record.message === 'string'
            ? arg2Record.message
            : null) || (arg1 instanceof Error ? arg1.message : 'Unknown Error')
        metadata = arg2Record as LogMetadata
        if (typeof arg3 === 'string') userId = arg3
      } else {
        message = arg1 instanceof Error ? arg1.message : 'Unknown Error'
      }
    } else {
      // Standard signature: message, errorObj, userId, metadata
      message = arg1
      errorObj = arg2
      if (typeof arg3 === 'string') {
        userId = arg3
        metadata = (arg4 as LogMetadata) || {}
      } else if (typeof arg3 === 'object' && arg3 !== null) {
        // logger.error('Msg', error, { meta })
        userId = 'SYSTEM'
        metadata = arg3 as LogMetadata
      }
    }

    if (this.isDev) {
      safeConsole.error(`[ERROR] ${message}`, errorObj || '', metadata || '')
    }

    const effectiveMetadata = {
      ...metadata,
      stack: errorObj instanceof Error ? errorObj.stack : new Error().stack,
      originalError:
        errorObj instanceof Error ? errorObj.message : String(errorObj),
      environment: this.isDev ? 'development' : 'production',
    }

    // Report to Sentry if available
    if (errorObj instanceof Error) {
      Sentry.captureException(errorObj, {
        extra: { message, ...metadata },
        user: userId !== 'SYSTEM' ? { id: userId } : undefined,
      })
    } else {
      Sentry.captureMessage(message, {
        level: 'error',
        extra: { ...metadata, originalError: String(errorObj) },
      })
    }

    // Enforce CRITICAL level for errors in persistLog
    this.persistLog('error', message, userId, effectiveMetadata)
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
    source: string = 'WEB_UI',
  ) {
    if (this.isDev) {
      safeConsole.log(
        `[AUDIT][${source}] ${actionName} on ${tableName}:${recordId}`,
        details || '',
      )
    }

    const typedSupabase = supabase

    // Validate recordId is a valid UUID to avoid PostgREST 22P02 error
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const isValidUUID = uuidRegex.test(recordId)

    const finalRecordId = isValidUUID
      ? recordId
      : '00000000-0000-0000-0000-000000000000'
    const finalMetadata =
      !isValidUUID && recordId !== '00000000-0000-0000-0000-000000000000'
        ? { ...details, original_record_id: recordId }
        : details

    const jsonMetadata = finalMetadata
      ? JSON.parse(JSON.stringify(finalMetadata))
      : null

    typedSupabase
      .from('audit_logs')
      .insert({
        user_id: userId === 'SYSTEM' ? null : userId,
        table_name: tableName,
        record_id: finalRecordId,
        action: actionName.toUpperCase(),
        source: source,
        new_data: jsonMetadata,
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error && this.isDev) {
          safeConsole.error('Failed to write to audit_logs:', error)
        }
      })
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
    source: string = 'WEB_UI',
  ) {
    return this.action(
      `SECURITY_${event}`,
      userId,
      tableName,
      recordId,
      details,
      source,
    )
  }

  /**
   * Internal method to write to Supabase.
   * Fire-and-forget approach to avoid blocking UI.
   */
  private static async persistLog(
    severity: LogLevel,
    message: string,
    userId: string,
    metadata?: LogMetadata,
  ) {
    // Enforce KONTROL branding on all messages
    const brandedMessage = `KONTROL: ${message}`

    // Don't await this in the main flow to avoid blocking
    const typedSupabase = supabase
    const jsonMetadata = metadata ? JSON.parse(JSON.stringify(metadata)) : null

    typedSupabase
      .from('system_logs')
      .insert({
        level: severity,
        severity: severity,
        message: brandedMessage,
        user_id: userId === 'SYSTEM' ? null : userId,
        metadata: jsonMetadata,
        timestamp: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error && this.isDev) {
          safeConsole.error('Failed to write to system_logs:', error)
        }
      })
  }
}

export const logger = Logger
