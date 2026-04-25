import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Loga erro de edge function em `system_logs` com level='error'. O trigger
 * SQL `on_system_log_error` (migration 20260420000013) detecta isso e
 * dispara o alerta `system_error` via send-critical-alert.
 *
 * Sem esse log, errors server-side ficam só no Supabase Edge Logs (que
 * não disparam triggers SQL) — você só descobre quando alguém reporta.
 *
 * Nunca lança: erro no logger não pode quebrar o handler que está logando.
 */
export async function logEdgeError(
  source: string,
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined

    await sb.from('system_logs').insert({
      level: 'error',
      message: `[edge:${source}] ${message.slice(0, 500)}`,
      metadata: JSON.stringify({
        source,
        stack: stack?.slice(0, 2000),
        ...context,
      }),
    })
  } catch {
    // engole — telemetria não pode quebrar o caller
  }
}
