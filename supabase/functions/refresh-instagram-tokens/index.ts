import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: connections } = await supabase
    .from('instagram_connections')
    .select('id, user_id, access_token, token_expires_at')

  if (!connections || connections.length === 0) {
    return new Response(
      JSON.stringify({ message: 'No connections to refresh' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  const results = []

  for (const conn of connections) {
    if (!conn.access_token) continue

    if (conn.token_expires_at) {
      const expiresAt = new Date(conn.token_expires_at)
      const daysUntilExpiry =
        (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      if (daysUntilExpiry > 15) {
        results.push({
          id: conn.id,
          status: 'skipped',
          days_left: Math.floor(daysUntilExpiry),
        })
        continue
      }
    }

    try {
      const response = await fetch(
        `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${conn.access_token}`,
      )
      const data = await response.json()

      if (data.access_token) {
        await supabase
          .from('instagram_connections')
          .update({
            access_token: data.access_token,
            token_expires_at: new Date(
              Date.now() + (data.expires_in || 5184000) * 1000,
            ).toISOString(),
          })
          .eq('id', conn.id)

        results.push({ id: conn.id, status: 'refreshed' })
      } else {
        results.push({
          id: conn.id,
          status: 'failed',
          error: data.error?.message || 'Unknown',
        })
      }
    } catch (error) {
      results.push({
        id: conn.id,
        status: 'error',
        error: (error as Error).message,
      })
    }
  }

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
