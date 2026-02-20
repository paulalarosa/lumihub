import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  SESClient,
  GetIdentityVerificationAttributesCommand,
} from 'https://esm.sh/@aws-sdk/client-ses'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const client = new SESClient({
      region: Deno.env.get('AWS_REGION_KHAOS'),
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID_KHAOS') ?? '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY_KHAOS') ?? '',
      },
    })

    const command = new GetIdentityVerificationAttributesCommand({
      Identities: [Deno.env.get('OFFICIAL_EMAIL_KHAOS') ?? ''],
    })

    const response = await client.send(command)

    return new Response(JSON.stringify({ status: 'operational' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ status: 'down', error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
