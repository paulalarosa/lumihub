import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Mercado Pago webhook received:', JSON.stringify(body));

    // Mercado Pago sends notifications with different types
    if (body.type === 'payment') {
      const paymentId = body.data?.id;
      
      if (!paymentId) {
        console.log('No payment ID in webhook');
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
      if (!accessToken) {
        console.error('MERCADO_PAGO_ACCESS_TOKEN not configured');
        return new Response(JSON.stringify({ error: 'Not configured' }), {
          status: 500,
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
