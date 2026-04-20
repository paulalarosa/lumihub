import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

serve(async (req) => {
  try {
    const { data: followups, error } = await supabase
      .from('scheduled_followups')
      .select(
        `
        *,
        template:message_templates(*),
        project:projects(*, client:wedding_clients(*), artist:makeup_artists(*))
      `,
      )
      .eq('status', 'pending')
      .lte('scheduled_for', new Date(Date.now() + 5 * 60 * 1000).toISOString())
      .limit(50)

    if (error) throw error

    for (const followup of followups || []) {
      try {
        let message = followup.template.body
        const variables = {
          client_name: followup.project.client?.name || 'Cliente',
          event_date: new Date(followup.project.event_date).toLocaleDateString(
            'pt-BR',
          ),
          event_time: followup.project.event_time || 'a confirmar',
          event_location: followup.project.event_location || 'a confirmar',
          event_type: followup.project.event_type || 'evento',
          makeup_artist_name: followup.project.artist?.name || '',
          makeup_artist_phone: followup.project.artist?.phone || '',
          review_link: `${Deno.env.get('APP_URL')}/review/${followup.project.id}`,
          current_promotion: '20% OFF em makes para o próximo mês! 🎉',
        }

        Object.entries(variables).forEach(([key, value]) => {
          message = message.replace(new RegExp(`{${key}}`, 'g'), value)
        })

        if (followup.template.channel === 'whatsapp') {
          await sendWhatsApp(followup.project.client?.phone, message)
        } else if (followup.template.channel === 'email') {
          await sendEmail(
            followup.project.client?.email,
            followup.template.subject,
            message,
          )
        }

        await supabase
          .from('scheduled_followups')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', followup.id)
      } catch (error: any) {
        await supabase
          .from('scheduled_followups')
          .update({
            status: 'failed',
            error_message: error.message,
          })
          .eq('id', followup.id)
      }
    }

    return new Response(JSON.stringify({ processed: followups?.length || 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function sendWhatsApp(phone: string, message: string) {
  const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')
  const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')
  const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE')

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return { success: false, error: 'WhatsApp not configured' }
  }

  const cleanPhone = phone.replace(/\D/g, '')
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

  const response = await fetch(
    `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: fullPhone,
        text: message,
      }),
    },
  )

  if (!response.ok) {
    const err = await response.text()

    return { success: false, error: err }
  }

  return { success: true }
}

async function sendEmail(to: string, subject: string, body: string) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { to, subject, html: body.replace(/\n/g, '<br>') },
  })

  if (error) throw error
  return data
}
