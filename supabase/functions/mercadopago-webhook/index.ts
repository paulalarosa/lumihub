import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { Logger } from "../_shared/logger.ts";

const logger = new Logger('mercadopago-webhook');

function getEnv(key: string): string | null {
  const val = Deno.env.get(key);
  if (!val) {
    console.error(`Missing environment variable: ${key}`);
    return null;
  }
  return val;
}

// HMAC-SHA256 signature validation for Mercado Pago webhooks
async function validateSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string
): Promise<boolean> {
  if (!xSignature || !xRequestId) {
    console.log('Missing signature headers');
    return false;
  }

  try {
    // Parse the x-signature header (format: "ts=...,v1=...")
    const signatureParts: Record<string, string> = {};
    xSignature.split(',').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        signatureParts[key.trim()] = value.trim();
      }
    });

    const ts = signatureParts['ts'];
    const v1 = signatureParts['v1'];

    if (!ts || !v1) {
      console.log('Invalid signature format');
      return false;
    }

    // Build the manifest string as per Mercado Pago docs
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Generate HMAC-SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(manifest));
    const computedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = computedHash === v1;
    if (!isValid) {
      console.log('Signature mismatch');
    }
    return isValid;
  } catch (error) {
    console.error('Error validating signature:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Mercado Pago webhook received:', JSON.stringify(body));

    // Get signature headers
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');

    // Get the webhook secret for signature validation
    const webhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET');

    // Validate signature if webhook secret is configured
    if (webhookSecret) {
      const dataId = body.data?.id?.toString() || '';
      const isValid = await validateSignature(xSignature, xRequestId, dataId, webhookSecret);

      if (!isValid) {
        console.error('Invalid webhook signature - rejecting request');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      console.log('Webhook signature validated successfully');
    } else {
      console.warn('MERCADO_PAGO_WEBHOOK_SECRET not configured - skipping signature validation');
    }

    // Mercado Pago sends notifications with different types
    if (body.type === 'payment') {
      const paymentId = body.data?.id;

      if (!paymentId) {
        console.log('No payment ID in webhook');
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const accessToken = getEnv('MERCADO_PAGO_ACCESS_TOKEN');
      if (!accessToken) {
        await logger.error('MERCADO_PAGO_ACCESS_TOKEN not configured - Cannot fetch payment details');
        return new Response(JSON.stringify({ error: 'Service configuration error', details: 'Missing Payment Access Token' }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Fetch payment details from Mercado Pago
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const paymentData = await paymentResponse.json();
      console.log('Payment data:', JSON.stringify(paymentData));

      // Update invoice status based on payment status
      if (paymentData.status === 'approved' && paymentData.external_reference) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Validate the external_reference is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(paymentData.external_reference)) {
          console.error('Invalid external_reference format:', paymentData.external_reference);
          return new Response(JSON.stringify({ error: 'Invalid reference' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { error } = await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('id', paymentData.external_reference);

        if (error) {
          console.error('Error updating invoice:', error);
        } else {
          console.log('Invoice marked as paid:', paymentData.external_reference);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in mercadopago-webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
