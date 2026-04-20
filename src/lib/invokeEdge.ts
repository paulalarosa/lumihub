import { supabase } from '@/integrations/supabase/client'

interface InvokeResult<T> {
  data: T | null
  error: { message: string; status?: number } | null
}

interface InvokeOptions {
  /**
   * If true, fetches the current user's session access_token and passes it
   * in the body as `user_token`. Edge Function is responsible for validating
   * the token via `supabase.auth.getUser(user_token)`.
   *
   * Use this for admin-only or user-context functions where the Supabase API
   * gateway rejects the ES256 JWT algorithm with
   * `UNSUPPORTED_TOKEN_ALGORITHM`.
   */
  passUserToken?: boolean
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

/**
 * Drop-in replacement for `supabase.functions.invoke` that bypasses the
 * ES256 JWT algorithm issue on the Supabase Gateway. Authenticates the
 * request with the anon key and (optionally) passes the caller's access
 * token in the body for Edge Function-side verification.
 */
export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown> = {},
  options: InvokeOptions = {},
): Promise<InvokeResult<T>> {
  if (!SUPABASE_URL || !ANON_KEY) {
    return {
      data: null,
      error: { message: 'Missing Supabase env vars' },
    }
  }

  const finalBody: Record<string, unknown> = { ...body }

  if (options.passUserToken) {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      return {
        data: null,
        error: { message: 'Não autenticada. Faça login novamente.' },
      }
    }
    finalBody.user_token = token
  }

  let res: Response
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalBody),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { data: null, error: { message: `Network: ${msg}` } }
  }

  let payload: unknown
  try {
    payload = await res.json()
  } catch {
    payload = null
  }

  if (!res.ok) {
    const msg =
      (payload as { error?: string } | null)?.error ||
      (payload as { message?: string } | null)?.message ||
      res.statusText
    return { data: null, error: { message: msg, status: res.status } }
  }

  return { data: payload as T, error: null }
}
