import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = 'mailto:contato@khaoskontrol.com.br'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { user_id, title, body, url, icon } = await req.json()

    if (!user_id || !title) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or title' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', user_id)
      .eq('is_active', true)

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: 'No active subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const payload = JSON.stringify({
      title,
      body: body || '',
      icon: icon || '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      data: { url: url || '/dashboard' },
    })

    let sent = 0
    const failed: string[] = []

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        }

        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            TTL: '86400',
          },
          body: payload,
        })

        if (response.ok || response.status === 201) {
          sent++
        } else if (response.status === 410 || response.status === 404) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', sub.id)
          failed.push(sub.id)
        }
      } catch {
        failed.push(sub.id)
      }
    }

    return new Response(
      JSON.stringify({
        sent,
        failed: failed.length,
        total: subscriptions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
