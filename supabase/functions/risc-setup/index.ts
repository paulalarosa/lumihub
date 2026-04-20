import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SignJWT, importPKCS8 } from 'https://esm.sh/jose@5.2.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

interface ServiceAccount {
  client_email: string
  private_key: string
  token_uri: string
}

const RISC_EVENTS = [
  'https://schemas.openid.net/secevent/risc/event-type/sessions-revoked',
  'https://schemas.openid.net/secevent/oauth/event-type/tokens-revoked',
  'https://schemas.openid.net/secevent/risc/event-type/account-disabled',
  'https://schemas.openid.net/secevent/risc/event-type/account-enabled',
  'https://schemas.openid.net/secevent/risc/event-type/account-purged',
  'https://schemas.openid.net/secevent/risc/event-type/verification',
]

const RISC_SCOPE = 'https://www.googleapis.com/auth/risc.configuration'

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  // Normalize private_key: when JSON is round-tripped through .env files,
  // newlines in the PEM often end up as literal `\n` (two chars) instead of
  // real line breaks. importPKCS8 requires real newlines.
  const pem = sa.private_key
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .trim()

  let privateKey: CryptoKey
  try {
    privateKey = await importPKCS8(pem, 'RS256')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      `PEM import failed: ${msg}. First 30 chars of key: "${pem.slice(0, 30)}"`,
    )
  }

  const jwt = await new SignJWT({
    scope: RISC_SCOPE,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience(sa.token_uri)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey)

  const res = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const data = (await res.json()) as {
    access_token?: string
    error?: string
    error_description?: string
  }
  if (!data.access_token) {
    throw new Error(
      `Token exchange failed: ${data.error_description || data.error || 'unknown'}`,
    )
  }
  return data.access_token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body = (await req.json().catch(() => ({}))) as {
      operation?: 'status' | 'configure' | 'verify' | 'disable'
      receiver_url?: string
      user_token?: string
    }

    // Accept user token from body (bypass ES256 gateway rejection) OR from
    // Authorization header (legacy HS256 projects).
    const authHeader = req.headers.get('Authorization')
    const bearerFromHeader = authHeader?.replace('Bearer ', '') ?? null
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const token =
      body.user_token ||
      (bearerFromHeader && bearerFromHeader !== anonKey
        ? bearerFromHeader
        : null)

    if (!token) return json({ error: 'Missing user token' }, 401)

    const { data: authData } = await supabase.auth.getUser(token)
    const callerId = authData?.user?.id
    if (!callerId) return json({ error: 'Invalid token' }, 401)

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', callerId)
      .single()
    if (profile?.role !== 'admin') return json({ error: 'Admin only' }, 403)

    const operation = body.operation ?? 'status'

    const saJson = Deno.env.get('GOOGLE_RISC_SA_JSON')
    if (!saJson) {
      return json(
        {
          error:
            'GOOGLE_RISC_SA_JSON secret not configured. Upload your RISC service account JSON.',
        },
        500,
      )
    }

    let sa: ServiceAccount
    try {
      sa = JSON.parse(saJson) as ServiceAccount
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return json(
        {
          error: 'GOOGLE_RISC_SA_JSON is not valid JSON',
          detail: msg,
          first_chars: saJson.slice(0, 50),
        },
        500,
      )
    }

    if (!sa.private_key || !sa.client_email || !sa.token_uri) {
      return json(
        {
          error: 'SA JSON missing required fields',
          got: {
            has_private_key: !!sa.private_key,
            has_client_email: !!sa.client_email,
            has_token_uri: !!sa.token_uri,
          },
        },
        500,
      )
    }

    let accessToken: string
    try {
      accessToken = await getAccessToken(sa)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return json(
        {
          error: 'Failed to get Google access token',
          detail: msg,
          client_email: sa.client_email,
        },
        502,
      )
    }

    const receiverUrl =
      body.receiver_url ||
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/risc-receiver`

    if (operation === 'status') {
      const res = await fetch(
        'https://risc.googleapis.com/v1beta/stream',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      const data = await res.json()
      return json({ operation, status: res.status, stream: data })
    }

    if (operation === 'configure') {
      const res = await fetch(
        'https://risc.googleapis.com/v1beta/stream:update',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            delivery: {
              delivery_method:
                'https://schemas.openid.net/secevent/risc/delivery-method/push',
              url: receiverUrl,
            },
            events_requested: RISC_EVENTS,
          }),
        },
      )
      const data = await res.json()
      if (!res.ok) return json({ operation, status: res.status, error: data }, res.status)
      return json({ operation, status: res.status, stream: data, receiver: receiverUrl })
    }

    if (operation === 'verify') {
      // Triggers a test security event
      const res = await fetch(
        'https://risc.googleapis.com/v1beta/stream:verify',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ state: 'manual-verify-' + Date.now() }),
        },
      )
      const text = await res.text()
      return json({
        operation,
        status: res.status,
        response: text,
        info:
          'Google sent a verification event to the receiver. Check public.risc_events table in ~10s.',
      })
    }

    if (operation === 'disable') {
      const res = await fetch(
        'https://risc.googleapis.com/v1beta/stream/status:update',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'disabled', reason: 'manual disable from admin' }),
        },
      )
      const data = await res.json()
      return json({ operation, status: res.status, result: data })
    }

    return json({ error: `Unknown operation: ${operation}` }, 400)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return json({ error: msg }, 500)
  }
})
