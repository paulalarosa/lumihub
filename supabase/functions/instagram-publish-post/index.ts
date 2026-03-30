import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

serve(async (req) => {
  let scheduled_post_id: string | undefined

  try {
    const body = await req.json()
    scheduled_post_id = body.scheduled_post_id

    // Buscar post agendado
    const { data: post, error: postError } = await supabase
      .from('instagram_scheduled_posts')
      .select('*, connection:instagram_connections(*)')
      .eq('id', scheduled_post_id)
      .single()

    if (postError) throw postError

    const accessToken = post.connection.access_token
    const instagramUserId = post.connection.instagram_user_id

    // Atualizar status
    await supabase
      .from('instagram_scheduled_posts')
      .update({ status: 'publishing' })
      .eq('id', scheduled_post_id)

    // 1. Upload de mídia(s)
    const containerIds: string[] = []

    for (const mediaUrl of post.media_urls) {
      let containerUrl = ''

      if (post.media_type === 'image' || post.media_type === 'carousel') {
        // Upload image container
        const containerResponse = await fetch(
          `https://graph.instagram.com/v21.0/${instagramUserId}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_url: mediaUrl,
              caption: containerIds.length === 0 ? post.caption : undefined, // Only on first
              access_token: accessToken,
            }),
          },
        )

        const containerData = await containerResponse.json()
        if (containerData.error) throw new Error(containerData.error.message)

        containerIds.push(containerData.id)
      } else if (post.media_type === 'video') {
        // Upload video container
        const containerResponse = await fetch(
          `https://graph.instagram.com/v21.0/${instagramUserId}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              media_type: 'VIDEO',
              video_url: mediaUrl,
              caption: post.caption,
              access_token: accessToken,
            }),
          },
        )

        const containerData = await containerResponse.json()
        if (containerData.error) throw new Error(containerData.error.message)

        containerIds.push(containerData.id)
      }
    }

    // 2. Publicar
    let publishEndpoint = ''
    let publishBody: any = {}

    if (post.media_type === 'carousel' && containerIds.length > 1) {
      // Carousel
      publishEndpoint = `https://graph.instagram.com/v21.0/${instagramUserId}/media`
      publishBody = {
        media_type: 'CAROUSEL',
        children: containerIds,
        caption: post.caption,
        access_token: accessToken,
      }
    } else {
      // Single image/video
      publishEndpoint = `https://graph.instagram.com/v21.0/${instagramUserId}/media_publish`
      publishBody = {
        creation_id: containerIds[0],
        access_token: accessToken,
      }
    }

    const publishResponse = await fetch(publishEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishBody),
    })

    const publishData = await publishResponse.json()

    if (publishData.error) {
      throw new Error(publishData.error.message)
    }

    const mediaId = publishData.id

    // 3. Buscar permalink
    const permalinkResponse = await fetch(
      `https://graph.instagram.com/v21.0/${mediaId}?fields=permalink&access_token=${accessToken}`,
    )

    const permalinkData = await permalinkResponse.json()

    // 4. Atualizar post como publicado
    await supabase
      .from('instagram_scheduled_posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        instagram_media_id: mediaId,
        instagram_permalink: permalinkData.permalink,
      })
      .eq('id', scheduled_post_id)

    // 5. Salvar em instagram_posts para analytics
    await supabase.from('instagram_posts').insert({
      user_id: post.user_id,
      instagram_connection_id: post.instagram_connection_id,
      instagram_media_id: mediaId,
      media_type: post.media_type,
      media_url: post.media_urls[0],
      permalink: permalinkData.permalink,
      caption: post.caption,
      timestamp: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({ success: true, permalink: permalinkData.permalink }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    console.error('Publish post error:', error)

    // Atualizar como falho
    if (scheduled_post_id) {
      await supabase
        .from('instagram_scheduled_posts')
        .update({
          status: 'failed',
          error_message: error.message,
          retry_count: 0, // Should be incremented by trigger or logic
        })
        .eq('id', scheduled_post_id)
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
