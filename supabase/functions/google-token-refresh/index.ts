import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

/**
 * Keeps Google Calendar tokens fresh without forcing the user to log in again.
 *
 * Called on app mount for authenticated users. Uses the stored refresh_token
 * to ask Google for a new access_token before the current one expires.
 * If refresh fails (token revoked, invalid_grant, etc), marks the integration
 * with `needs_reauth=true` so the UI can show a reconnect banner.
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

    const body = (await req.json().catch(() => ({}))) as {
      user_token?: string
      force?: boolean
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const bearer = req.headers.get('Authorization')?.replace('Bearer ', '')
    const token =
      body.user_token ||
      (bearer && bearer !== anonKey ? bearer : null)

    if (!token) return json({ error: 'Missing user token' }, 401)

    const { data: authData } = await sb.auth.getUser(token)
    const userId = authData?.user?.id
    if (!userId) return json({ error: 'Invalid token' }, 401)

    const { data: tokenRow } = await sb
      .from('google_calendar_tokens')
      .select('refresh_token, token_expiry, needs_reauth')
      .eq('user_id', userId)
      .maybeSingle()

    if (!tokenRow) {
      return json({ status: 'not_connected' })
    }

    // Fresh enough? (>5min remaining and not forced)
    if (!body.force && tokenRow.token_expiry) {
      const msLeft = new Date(tokenRow.token_expiry).getTime() - Date.now()
      if (msLeft > 5 * 60 * 1000) {
        return json({ status: 'fresh', expires_in_seconds: Math.round(msLeft / 1000) })
      }
    }

    if (!tokenRow.refresh_token) {
      await sb
        .from('google_calendar_tokens')
        .update({ needs_reauth: true })
        .eq('user_id', userId)
      return json({ status: 'needs_reauth', reason: 'no refresh_token stored' })
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    if (!clientId || !clientSecret) {
      return json({ error: 'Google OAuth not configured' }, 500)
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenRow.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    const tokenData = (await res.json()) as {
      access_token?: string
      expires_in?: number
      error?: string
      error_description?: string
    }

    if (!tokenData.access_token) {
      // invalid_grant = refresh token revoked (user removed access)
      const irrevocable =
        tokenData.error === 'invalid_grant' ||
        tokenData.error === 'invalid_client'
      if (irrevocable) {
        await sb
          .from('google_calendar_tokens')
          .update({ needs_reauth: true })
          .eq('user_id', userId)
      }
      return json(
        {
          status: irrevocable ? 'needs_reauth' : 'refresh_failed',
          reason: tokenData.error_description || tokenData.error || 'unknown',
        },
        irrevocable ? 200 : 502,
      )
    }

    await sb
      .from('google_calendar_tokens')
      .update({
        access_token: tokenData.access_token,
        token_expiry: new Date(
          Date.now() + (tokenData.expires_in ?? 3600) * 1000,
        ).toISOString(),
        needs_reauth: false,
      })
      .eq('user_id', userId)

    return json({
      status: 'refreshed',
      expires_in_seconds: tokenData.expires_in ?? 3600,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return json({ error: msg }, 500)
  }
})
