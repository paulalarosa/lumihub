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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
  const limit = checkRateLimit(clientIp, { maxRequests: 5, windowMs: 60000 })
  if (!limit.allowed) {
    return rateLimitResponse(limit.resetAt)
  }

  try {
    const { email } = await req.json()

    if (!email) {
      throw new Error('Email is required')
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Supabase credentials not configured')
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    })

    if (error) throw error
    if (!data.properties?.action_link)
      throw new Error('Failed to generate action link')

    const recoveryLink = data.properties.action_link

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured')
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
      Destination: { ToAddresses: [email] },
      Template: 'Khaos_ResetPassword',
      TemplateData: JSON.stringify({
        action_url: recoveryLink,
        email: email,
      }),
    })

    await sesClient.send(command)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
