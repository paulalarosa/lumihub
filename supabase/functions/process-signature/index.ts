import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts'
import { logEdgeError } from '../_shared/log-error.ts'

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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const {
      signature_request_id,
      token,
      signer_name,
      signer_cpf,
      signature_method,
      signature_data,
      geolocation,
      device_fingerprint,
    } = await req.json()

    if (
      !signature_request_id ||
      !token ||
      !signer_name ||
      !signature_method ||
      !signature_data
    ) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { data: validation, error: valError } = await supabase.rpc(
      'validate_signature_access_token',
      {
        p_signature_request_id: signature_request_id,
        p_token: token,
      },
    )

    if (valError || !validation?.valid) {
      return new Response(
        JSON.stringify({
          error: validation?.error || 'Token invalido ou expirado',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const signerEmail = validation.signer_email
    const contractId = validation.contract_id
    const ipAddress =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      '0.0.0.0'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const signedAt = new Date()

    const { data: signatureHash, error: hashError } = await supabase.rpc(
      'generate_signature_hash',
      {
        p_signer_name: signer_name,
        p_signer_email: signerEmail,
        p_signer_cpf: signer_cpf || '',
        p_signature_data: signature_data,
        p_contract_id: contractId,
        p_timestamp: signedAt.toISOString(),
        p_ip_address: ipAddress,
        p_device_fingerprint: device_fingerprint || '',
      },
    )

    if (hashError) throw hashError

    let signatureImageUrl: string | null = null

    if (signature_method === 'drawn' && signature_data.includes('base64')) {
      try {
        const base64Part = signature_data.split(',')[1]
        const binaryStr = atob(base64Part)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i)
        }

        const fileName = `signatures/${contractId}/${signerEmail.replace('@', '_at_')}-${Date.now()}.png`
        const { error: uploadError } = await supabase.storage
          .from('signed-contracts')
          .upload(fileName, bytes, { contentType: 'image/png' })

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('signed-contracts')
            .getPublicUrl(fileName)
          signatureImageUrl = urlData.publicUrl
        }
      } catch (uploadErr) {}
    }

    const placeholderCertHash = signatureHash + '-cert'

    const { data: signature, error: sigError } = await supabase
      .from('contract_signatures')
      .insert({
        signature_request_id,
        contract_id: contractId,
        signer_name,
        signer_email: signerEmail,
        signer_cpf: signer_cpf || null,
        signer_role: 'signer',
        signature_method,
        signature_data,
        signature_image_url: signatureImageUrl,
        ip_address: ipAddress,
        user_agent: userAgent,
        geolocation: geolocation || null,
        device_fingerprint: device_fingerprint || null,
        signed_at: signedAt.toISOString(),
        signature_hash: signatureHash,
        certificate_hash: placeholderCertHash,
        certificate_data: {},
      })
      .select()
      .single()

    if (sigError) throw sigError

    const { data: certificate, error: certError } = await supabase.rpc(
      'generate_signature_certificate',
      { p_signature_id: signature.id },
    )

    if (!certError && certificate) {
      const certJson = JSON.stringify(certificate)
      const encoder = new TextEncoder()
      const data = encoder.encode(certJson)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const certificateHash = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      await supabase
        .from('contract_signatures')
        .update({
          certificate_data: certificate,
          certificate_hash: certificateHash,
        })
        .eq('id', signature.id)
    }

    await supabase.from('signature_audit_log').insert({
      signature_id: signature.id,
      signature_request_id,
      event_type: 'signature_completed',
      actor_email: signerEmail,
      actor_ip: ipAddress,
      event_data: {
        method: signature_method,
        has_cpf: !!signer_cpf,
        geolocation: geolocation || null,
      },
    })

    return new Response(
      JSON.stringify({
        signature_id: signature.id,
        status: 'signed',
        certificate_hash: signature.certificate_hash,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: unknown) {
    await logEdgeError('process-signature', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
