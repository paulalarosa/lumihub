import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Logger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logger = new Logger('create-payment');

interface ProjectData {
  name: string;
  public_token: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id, payer_email } = await req.json();

    // Validate invoice_id format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!invoice_id || !uuidRegex.test(invoice_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid invoice ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await logger.info('Creating Mercado Pago payment', { invoice_id, payer_email });

    // Create Supabase client with service role to fetch invoice details
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // RATE LIMITING CHECK
    // Check if there was a payment attempt for this invoice in the last 1 minute
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentLogs } = await supabaseAdmin
      .from('system_logs')
      .select('id')
      .eq('source', 'create-payment')
      .contains('metadata', { invoice_id }) // JSONB containment check
      .gt('created_at', oneMinuteAgo)
      .limit(5); // If more than 5 attempts in a minute, block

    if (recentLogs && recentLogs.length >= 3) {
      await logger.warn('Rate limit exceeded for invoice', { invoice_id });
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please wait a minute.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch invoice with related project data to verify it exists and get amount
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        id,
        amount,
        description,
        status,
        user_id,
        project_id,
        projects:project_id (
          name,
          public_token
        )
      `)
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      await logger.warn('Invoice not found', { invoice_id });
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return new Response(
        JSON.stringify({ error: 'Invoice already paid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract project data e.g. [ { name, public_token } ] or { name, public_token }
    // handle both array and object formats
    const projectsData = invoice.projects;
    let project: ProjectData | null = null;

    if (Array.isArray(projectsData) && projectsData.length > 0) {
      project = projectsData[0] as ProjectData;
    } else if (projectsData && typeof projectsData === 'object') {
      project = projectsData as ProjectData;
    }

    let isAuthorized = false;

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      // Check if authenticated user owns the invoice
      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user } } = await supabaseAuth.auth.getUser();

      if (user && user.id === invoice.user_id) {
        isAuthorized = true;
      }
    }

    // Allow public access if project has a public_token (client portal)
    if (!isAuthorized && project?.public_token) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      await logger.warn('Unauthorized access attempt', { invoice_id });
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      await logger.error('MERCADO_PAGO_ACCESS_TOKEN missing');
      return new Response(
        JSON.stringify({ error: 'Mercado Pago não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Mercado Pago preference
    const preferenceData = {
      items: [
        {
          title: invoice.description || `Pagamento - ${project?.name || 'Projeto'}`,
          quantity: 1,
          unit_price: Number(invoice.amount),
          currency_id: 'BRL',
        }
      ],
      payer: payer_email ? { email: payer_email } : undefined,
      external_reference: invoice.id,
      back_urls: {
        success: `${req.headers.get('origin') || 'https://khaoskontrol.com.br'}/pagamento/sucesso`,
        failure: `${req.headers.get('origin') || 'https://khaoskontrol.com.br'}/pagamento/erro`,
        pending: `${req.headers.get('origin') || 'https://khaoskontrol.com.br'}/pagamento/pendente`,
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
    };

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
      await logger.error('Mercado Pago API error', { error: data });
      return new Response(
        JSON.stringify({ error: 'Erro ao criar pagamento' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await logger.info('Payment preference created', { preference_id: data.id });

    return new Response(
      JSON.stringify({
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
        preference_id: data.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    await logger.error('Internal server error', { error });
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
