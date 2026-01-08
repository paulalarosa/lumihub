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
    const { invoice_id, invoice_amount, invoice_description, project_name, payer_email } = await req.json();

    console.log('Creating Mercado Pago payment for invoice:', invoice_id);

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Mercado Pago não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Mercado Pago preference
    const preferenceData = {
      items: [
        {
          title: invoice_description || `Pagamento - ${project_name}`,
          quantity: 1,
          unit_price: Number(invoice_amount),
          currency_id: 'BRL',
        }
      ],
      payer: payer_email ? { email: payer_email } : undefined,
      external_reference: invoice_id,
      back_urls: {
        success: `${req.headers.get('origin') || 'https://lovable.dev'}/pagamento/sucesso`,
        failure: `${req.headers.get('origin') || 'https://lovable.dev'}/pagamento/erro`,
        pending: `${req.headers.get('origin') || 'https://lovable.dev'}/pagamento/pendente`,
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
    };

    console.log('Creating preference with data:', JSON.stringify(preferenceData));

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mercado Pago API error:', data);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar pagamento', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Payment preference created:', data.id);

    return new Response(
      JSON.stringify({ 
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
        preference_id: data.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-payment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
