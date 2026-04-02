import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

serve(async (req) => {
  try {
    const { connection_id } = await req.json()

    const { data: connection, error: connError } = await supabase
      .from('instagram_connections')
      .select('*')
      .eq('id', connection_id)
      .single()

    if (connError) throw connError

    const accessToken = connection.access_token

    const { data: posts } = await supabase
      .from('instagram_posts')
      .select('instagram_media_id')
      .eq('instagram_connection_id', connection_id)
      .gte(
        'timestamp',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      )

    for (const post of posts || []) {
      const insightsResponse = await fetch(
        `https://graph.instagram.com/v21.0/${post.instagram_media_id}/insights?metric=engagement,impressions,reach,saved&access_token=${accessToken}`,
      )

      const insightsData = await insightsResponse.json()

      if (insightsData.error) {
        continue
      }

      const mediaResponse = await fetch(
        `https://graph.instagram.com/v21.0/${post.instagram_media_id}?fields=like_count,comments_count&access_token=${accessToken}`,
      )

      const mediaData = await mediaResponse.json()

      const metrics: any = {}
      insightsData.data?.forEach((item: any) => {
        metrics[item.name] = item.values[0].value
      })

      const followers = connection.followers_count || 1
      const engagementRate = calculate_engagement_rate(
        mediaData.like_count || 0,
        mediaData.comments_count || 0,
        metrics.saved || 0,
        followers,
      )

      await supabase
        .from('instagram_posts')
        .update({
          like_count: mediaData.like_count || 0,
          comment_count: mediaData.comments_count || 0,
          saved_count: metrics.saved || 0,
          reach: metrics.reach || 0,
          impressions: metrics.impressions || 0,
          engagement_rate: engagementRate,
          last_synced_at: new Date().toISOString(),
        })
        .eq('instagram_media_id', post.instagram_media_id)
    }

    await supabase
      .from('instagram_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', connection_id)

    return new Response(
      JSON.stringify({ success: true, synced_posts: posts?.length || 0 }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

function calculate_engagement_rate(
  likes: number,
  comments: number,
  saves: number,
  followers: number,
) {
  return (
    Math.round(((likes + comments + saves) / Math.max(followers, 1)) * 10000) /
    100
  )
}
