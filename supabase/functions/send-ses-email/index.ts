import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  SESClient,
  SendTemplatedEmailCommand,
} from 'https://esm.sh/@aws-sdk/client-ses@3'
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts'

const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID')
const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY')
const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1'
const SES_SOURCE_EMAIL =
  Deno.env.get('SES_SOURCE_EMAIL') || 'noreply@khaoskontrol.com.br'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string[]
  template: string
  templateData: Record<string, any>
  userId?: string // Optional: used for logging
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
  const limit = checkRateLimit(clientIp, { maxRequests: 10, windowMs: 60000 })
  if (!limit.allowed) {
    return rateLimitResponse(limit.resetAt)
  }

  const reqClone = req.clone()

  try {
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured')
    }

    const { to, template, templateData, userId }: EmailRequest =
      await req.json()

    if (!to || to.length === 0 || !template || !templateData) {
      throw new Error('Missing required fields: to, template, or templateData')
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    // Filter out invalid/unsubscribed recipients across all relevant tables
    const [
      { data: profileStatus },
      { data: clientStatus },
      { data: leadStatus },
      { data: inviteStatus },
    ] = await Promise.all([
      supabase.from('profiles').select('email, email_status').in('email', to),
      supabase
        .from('wedding_clients')
        .select('email, email_status')
        .in('email', to),
      supabase.from('leads').select('email, email_status').in('email', to),
      supabase
        .from('assistant_invites')
        .select('assistant_email, email_status')
        .in('assistant_email', to),
    ])

    const blacklisted = new Set<string>()

    const checkStatus = (list: any[] | null, emailField: string = 'email') => {
      list?.forEach((item) => {
        if (
          item.email_status === 'invalid' ||
          item.email_status === 'unsubscribed'
        ) {
          blacklisted.add(item[emailField])
        }
      })
    }

    checkStatus(profileStatus)
    checkStatus(clientStatus)
    checkStatus(leadStatus)
    checkStatus(inviteStatus, 'assistant_email')

    const recipientsToSend = to.filter((email) => !blacklisted.has(email))

    if (recipientsToSend.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'All recipients are blacklisted (invalid or unsubscribed).',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    const sesClient = new SESClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    })

    const command = new SendTemplatedEmailCommand({
      Source: SES_SOURCE_EMAIL,
      Destination: {
        ToAddresses: to,
      },
      Template: template,
      TemplateData: JSON.stringify(templateData),
    })

    const response = await sesClient.send(command)

    // Log to Supabase if configured
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

      // We iterate over recipients to log individual entries, or just log once request
      // Ideally notifications log should be per recipient
      const logEntries = to.map((recipient) => ({
        user_id: userId || null, // Best effort linkage
        type: 'email',
        recipient: recipient,
        status: 'sent',
        provider_id: response.MessageId,
        metadata: {
          template: template,
          provider: 'aws-ses',
        },
      }))

      await supabase.from('notification_logs').insert(logEntries)
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: response.MessageId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('SES Error:', error)

    try {
      const {
        to: errorTo,
        template: errorTemplate,
        userId: errorUserId,
      } = await reqClone.json()
      console.error('Email send failed:', {
        to: errorTo,
        template: errorTemplate,
        userId: errorUserId,
        error: error.message,
      })

      // Log failure to Supabase if configured
      if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        if (Array.isArray(errorTo)) {
          const logEntries = errorTo.map((recipient: string) => ({
            user_id: errorUserId || null,
            type: 'email',
            recipient: recipient,
            status: 'failed',
            error_message: error.message,
            metadata: {
              template: errorTemplate,
              provider: 'aws-ses',
            },
          }))
          await supabase.from('notification_logs').insert(logEntries)
        }
      }
    } catch (_) {
      console.error('Email send failed (could not parse body):', error.message)
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
