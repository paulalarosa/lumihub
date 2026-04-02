import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const {
      contract_id,
      signers,
      signature_flow = 'parallel',
      expires_in_days = 30,
    } = await req.json()

    if (
      !contract_id ||
      !signers ||
      !Array.isArray(signers) ||
      signers.length === 0
    ) {
      return new Response(
        JSON.stringify({ error: 'Missing contract_id or signers array' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contract_id)
      .single()

    if (contractError || !contract) {
      return new Response(JSON.stringify({ error: 'Contract not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const expiresAt = new Date(
      Date.now() + expires_in_days * 24 * 60 * 60 * 1000,
    ).toISOString()

    const { data: request, error: requestError } = await supabase
      .from('signature_requests')
      .insert({
        contract_id,
        project_id: contract.project_id,
        created_by: user.id,
        signers,
        signature_flow,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (requestError) throw requestError

    const appUrl = Deno.env.get('APP_URL') || 'https://khaoskontrol.com.br'
    const accessLinks: Record<string, string> = {}

    for (const signer of signers) {
      const { data: tokenData, error: tokenError } = await supabase.rpc(
        'generate_signature_access_token',
        {
          p_signature_request_id: request.id,
          p_signer_email: signer.email,
        },
      )

      if (tokenError) {
        continue
      }

      const accessUrl = `${appUrl}/assinar/${request.id}?token=${tokenData}`
      accessLinks[signer.email] = accessUrl

      await supabase.from('signature_audit_log').insert({
        signature_request_id: request.id,
        event_type: 'invitation_sent',
        actor_email: signer.email,
        event_data: {
          sent_at: new Date().toISOString(),
          access_url: accessUrl,
        },
      })
    }

    await supabase.from('signature_audit_log').insert({
      signature_request_id: request.id,
      event_type: 'request_created',
      actor_email: user.email,
      event_data: {
        total_signers: signers.length,
        flow: signature_flow,
        expires_at: expiresAt,
      },
    })

    return new Response(
      JSON.stringify({
        request_id: request.id,
        access_links: accessLinks,
        expires_at: expiresAt,
        status: 'pending',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
