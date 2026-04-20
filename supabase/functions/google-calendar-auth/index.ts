import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

type BodyData = {
  action?: string
  redirect_uri?: string
  code?: string
  state?: string
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    let body: BodyData = {}

    const text = await req.text()
    if (text && text.trim().length > 0) {
      try {
        body = JSON.parse(text) as BodyData
      } catch (_) {
        return json({ error: 'Invalid JSON body' }, 400)
      }
    }

    const action = body.action ?? url.searchParams.get('action') ?? undefined

    if (!action) {
      return json(
        { error: 'Missing action', received: { method: req.method, hasBody: text.length > 0 } },
        400,
      )
    }

    if (action === 'get-auth-url') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) return json({ error: 'Unauthorized' }, 401)

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      const token = authHeader.replace('Bearer ', '')
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token)

      if (authError || !user) return json({ error: 'Unauthorized' }, 401)

      const redirect_uri = body.redirect_uri
      if (!redirect_uri) return json({ error: 'Missing redirect_uri' }, 400)

      // Generate cryptographically random CSRF state
      const stateBytes = new Uint8Array(32)
      crypto.getRandomValues(stateBytes)
      const stateToken = btoa(String.fromCharCode(...stateBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

      // PKCE verifier/challenge (S256)
      const verifierBytes = new Uint8Array(32)
      crypto.getRandomValues(verifierBytes)
      const codeVerifier = btoa(String.fromCharCode(...verifierBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

      const challengeBuf = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(codeVerifier),
      )
      const codeChallenge = btoa(
        String.fromCharCode(...new Uint8Array(challengeBuf)),
      )
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

      // Persist state for validation on callback
      const { error: stateErr } = await supabase.from('oauth_states').insert({
        state_token: stateToken,
        user_id: user.id,
        provider: 'google',
        code_verifier: codeVerifier,
        redirect_uri,
      })
      if (stateErr) {
        return json({ error: `Failed to persist state: ${stateErr.message}` }, 500)
      }

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', redirect_uri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set(
        'scope',
        'https://www.googleapis.com/auth/calendar',
      )
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('include_granted_scopes', 'true')
      authUrl.searchParams.set('state', stateToken)
      authUrl.searchParams.set('code_challenge', codeChallenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')

      return json({ url: authUrl.toString() })
    }

    if (action === 'callback') {
      const { code, state: userId, redirect_uri } = body

      if (!code || !userId) {
        return json({ error: 'Missing code or state' }, 400)
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirect_uri || '',
          grant_type: 'authorization_code',
        } as Record<string, string>),
      })

      const tokenData = (await tokenResponse.json()) as {
        access_token?: string
        refresh_token?: string
        expires_in?: number
        error?: string
        error_description?: string
      }

      if (tokenData.error) {
        return json(
          { error: tokenData.error_description || tokenData.error },
          400,
        )
      }

      const calendarResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary',
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
      )

      const calendarData = (await calendarResponse.json()) as { id?: string }
      const calendarId = calendarData.id || 'primary'

      const supabaseClient = createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
      )

      const { error: rpcError } = await supabaseClient.rpc(
        'save_google_integration',
        {
          p_user_id: userId,
          p_access_token: tokenData.access_token,
          p_refresh_token: tokenData.refresh_token,
          p_calendar_id: calendarId,
          p_expires_in: tokenData.expires_in,
        },
      )

      if (rpcError) return json({ error: 'Failed to save integration' }, 500)

      return json({ success: true })
    }

    if (action === 'disconnect') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) return json({ error: 'Unauthorized' }, 401)

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      const token = authHeader.replace('Bearer ', '')
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token)

      if (authError || !user) return json({ error: 'Unauthorized' }, 401)

      const { data: integration } = await supabase
        .from('user_integrations')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single()

      if (integration?.access_token) {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${integration.access_token}`,
          { method: 'POST' },
        )
      }

      const { error: deleteError } = await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google')

      if (deleteError) return json({ error: 'Failed to disconnect' }, 500)

      await supabase
        .from('events')
        .update({ google_calendar_event_id: null })
        .eq('user_id', user.id)

      return json({ success: true })
    }

    return json({ error: 'Invalid action', action }, 400)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return json({ error: errorMessage }, 500)
  }
})
