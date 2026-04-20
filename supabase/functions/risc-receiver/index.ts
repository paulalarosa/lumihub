import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jwtVerify, createRemoteJWKSet } from 'https://esm.sh/jose@5.2.0'

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

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
)

const GOOGLE_RISC_ISSUER = 'https://accounts.google.com'

// Events Google emits for Cross-Account Protection.
// https://developers.google.com/identity/protocols/risc#supported_events
const EVENT_KEYS = {
  SESSIONS_REVOKED:
    'https://schemas.openid.net/secevent/risc/event-type/sessions-revoked',
  TOKENS_REVOKED:
    'https://schemas.openid.net/secevent/oauth/event-type/tokens-revoked',
  ACCOUNT_DISABLED:
    'https://schemas.openid.net/secevent/risc/event-type/account-disabled',
  ACCOUNT_ENABLED:
    'https://schemas.openid.net/secevent/risc/event-type/account-enabled',
  ACCOUNT_PURGED:
    'https://schemas.openid.net/secevent/risc/event-type/account-purged',
  VERIFICATION:
    'https://schemas.openid.net/secevent/risc/event-type/verification',
}

/**
 * Google POSTs Security Event Tokens (SETs) here.
 * Content-Type: application/secevent+jwt
 * Body: single JWT string.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const expectedAud = Deno.env.get('GOOGLE_CLIENT_ID')
    if (!expectedAud) return json({ error: 'GOOGLE_CLIENT_ID not set' }, 500)

    const jwt = (await req.text()).trim()
    if (!jwt) return json({ error: 'Empty body' }, 400)

    let payload: {
      iss?: string
      aud?: string
      iat?: number
      jti?: string
      events?: Record<string, { subject?: { email?: string; sub?: string } }>
    }

    try {
      const result = await jwtVerify(jwt, GOOGLE_JWKS, {
        issuer: GOOGLE_RISC_ISSUER,
        audience: expectedAud,
      })
      payload = result.payload as typeof payload
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'invalid token'
      return json({ error: `JWT verification failed: ${msg}` }, 401)
    }

    if (!payload.events) return json({ error: 'No events in SET' }, 400)

    for (const [eventType, eventData] of Object.entries(payload.events)) {
      const subjectEmail = eventData?.subject?.email ?? null
      const subjectId = eventData?.subject?.sub ?? null

      const { data: inserted } = await sb
        .from('risc_events')
        .insert({
          event_type: eventType,
          subject_id: subjectId,
          subject_email: subjectEmail,
          issued_at: payload.iat
            ? new Date(payload.iat * 1000).toISOString()
            : null,
          raw_payload: payload,
        })
        .select('id')
        .single()

      let action = 'logged'

      // React to security events by revoking local integration
      if (
        subjectEmail &&
        (eventType === EVENT_KEYS.SESSIONS_REVOKED ||
          eventType === EVENT_KEYS.TOKENS_REVOKED ||
          eventType === EVENT_KEYS.ACCOUNT_DISABLED ||
          eventType === EVENT_KEYS.ACCOUNT_PURGED)
      ) {
        const { data: profile } = await sb
          .from('profiles')
          .select('id')
          .eq('email', subjectEmail)
          .maybeSingle()

        if (profile) {
          await sb.rpc('revoke_google_integration_for_user', {
            p_user_id: profile.id,
          })
          action = `revoked google integration for ${profile.id}`
        } else {
          action = 'user not found by email'
        }
      }

      if (inserted?.id) {
        await sb
          .from('risc_events')
          .update({ acted_on: true, action_taken: action })
          .eq('id', inserted.id)
      }
    }

    return json({ received: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return json({ error: msg }, 500)
  }
})
