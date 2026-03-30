import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@2.0.0'
import {
  adminNotificationTemplate,
  userConfirmationTemplate,
} from './email-templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => null)
    if (!body) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { name, email, instagram, challenge } = body
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const RESEND_TO = Deno.env.get('RESEND_TO')

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (!RESEND_TO) {
      return new Response(
        JSON.stringify({ error: 'RESEND_TO (recipient) not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const resend = new Resend(RESEND_API_KEY)

    // Send admin notification
    const adminSend = await resend.emails.send({
      from: 'KONTROL <no-reply@khaoskontrol.com.br>',
      to: RESEND_TO,
      subject: `✨ Nova aplicação KONTROL — ${name}`,
      html: adminNotificationTemplate({
        userName: name,
        userEmail: email,
        userInstagram: instagram || '',
        userChallenge: challenge || '',
      }),
    })

    // Send user confirmation
    const userSend = await resend.emails.send({
      from: 'KONTROL <no-reply@khaoskontrol.com.br>',
      to: email,
      subject: 'Recebemos sua aplicação! — KONTROL',
      html: userConfirmationTemplate({
        userName: name,
        userEmail: email,
        userInstagram: instagram || '',
        userChallenge: challenge || '',
      }),
    })

    return new Response(
      JSON.stringify({ ok: true, admin: adminSend, user: userSend }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
