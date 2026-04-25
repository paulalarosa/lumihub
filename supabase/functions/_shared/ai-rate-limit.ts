import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Rate limit DB-backed pros edge functions de IA. Persiste entre cold
 * starts (o _shared/rate-limit.ts in-memory não serve pra proteção de
 * custo de API paga).
 */
interface QuotaResult {
  allowed: boolean
  remaining: number
  reset_at: string
}

export async function consumeAiQuota(
  userId: string,
  endpoint: string,
  maxPerHour = 50,
): Promise<QuotaResult> {
  const sb = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data, error } = await sb.rpc('try_consume_ai_quota', {
    p_user_id: userId,
    p_endpoint: endpoint,
    p_max_per_hour: maxPerHour,
  })

  if (error || !data || !Array.isArray(data) || data.length === 0) {
    // Falha aberto: 1 erro no rate limiter não pode bloquear todo mundo.
    return {
      allowed: true,
      remaining: maxPerHour,
      reset_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    }
  }

  return data[0] as QuotaResult
}

export function aiQuotaResponse(quota: QuotaResult): Response {
  const retryAfterSec = Math.max(
    1,
    Math.ceil((new Date(quota.reset_at).getTime() - Date.now()) / 1000),
  )
  return new Response(
    JSON.stringify({
      error: 'Limite de IA atingido. Tente novamente mais tarde.',
      reset_at: quota.reset_at,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': quota.reset_at,
      },
    },
  )
}
