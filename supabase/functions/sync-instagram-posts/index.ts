import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const MEDIA_FIELDS =
  'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count'
const LIMIT_PER_CONNECTION = 24

interface GraphMedia {
  id: string
  caption?: string
  media_type?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
  like_count?: number
  comments_count?: number
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = await req.json().catch(() => ({}))
    const specificConnectionId = body?.connection_id as string | undefined

    let query = supabase
      .from('instagram_connections')
      .select('id, user_id, access_token, token_expires_at')
      .not('access_token', 'is', null)

    if (specificConnectionId) {
      query = query.eq('id', specificConnectionId)
    }

    const { data: connections, error } = await query
    if (error) throw error

    if (!connections || connections.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No connections to sync', synced: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const results: Array<Record<string, unknown>> = []

    for (const conn of connections) {
      if (!conn.access_token) continue

      if (conn.token_expires_at) {
        const expiresAt = new Date(conn.token_expires_at)
        if (expiresAt.getTime() < Date.now()) {
          results.push({ id: conn.id, status: 'token_expired' })
          continue
        }
      }

      try {
        const url = `https://graph.instagram.com/v21.0/me/media?fields=${MEDIA_FIELDS}&limit=${LIMIT_PER_CONNECTION}&access_token=${conn.access_token}`
        const response = await fetch(url)
        const payload = await response.json()

        if (!response.ok || payload.error) {
          results.push({
            id: conn.id,
            status: 'graph_error',
            message: payload.error?.message ?? response.statusText,
          })
          continue
        }

        const media: GraphMedia[] = payload.data ?? []

        if (media.length === 0) {
          results.push({ id: conn.id, status: 'empty' })
          continue
        }

        const rows = media.map((m) => ({
          user_id: conn.user_id,
          instagram_connection_id: conn.id,
          instagram_media_id: m.id,
          media_type: m.media_type ?? null,
          media_url:
            m.media_type === 'VIDEO' ? m.thumbnail_url ?? m.media_url ?? null : m.media_url ?? null,
          caption: m.caption ?? null,
          permalink: m.permalink ?? null,
          timestamp: m.timestamp ?? null,
          like_count: m.like_count ?? null,
          comment_count: m.comments_count ?? null,
          last_synced_at: new Date().toISOString(),
        }))

        const { error: upsertErr } = await supabase
          .from('instagram_posts')
          .upsert(rows, { onConflict: 'instagram_media_id' })

        if (upsertErr) {
          results.push({ id: conn.id, status: 'upsert_error', message: upsertErr.message })
          continue
        }

        await supabase
          .from('instagram_connections')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', conn.id)

        results.push({ id: conn.id, status: 'synced', count: rows.length })
      } catch (err) {
        results.push({
          id: conn.id,
          status: 'exception',
          message: (err as Error).message,
        })
      }
    }

    return new Response(
      JSON.stringify({
        processed: connections.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
