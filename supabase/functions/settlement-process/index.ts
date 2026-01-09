import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Service role client for backend operations (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        },
      }
    )

    const { days_pending = 7 } = await req.json()

    // Find all wallets with pending balance older than X days
    // In production, you'd check transaction timestamps
    const { data: wallets, error: walletsError } = await supabaseClient
      .from('wallets')
      .select('id, user_id, pending_balance, available_balance')
      .gt('pending_balance', 0)

    if (walletsError) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch wallets: ${walletsError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For each wallet, move pending to available (settlement simulation)
    let settledCount = 0
    let totalSettled = 0n
    const errors: string[] = []

    for (const wallet of wallets || []) {
      if (wallet.pending_balance > 0) {
        const newAvailable = wallet.available_balance + wallet.pending_balance
        const { error: updateError } = await supabaseClient
          .from('wallets')
          .update({
            available_balance: newAvailable,
            pending_balance: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id)

        if (updateError) {
          errors.push(`Wallet ${wallet.id}: ${updateError.message}`)
        } else {
          settledCount++
          totalSettled += BigInt(Math.floor(wallet.pending_balance * 100))
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        settled_wallets: settledCount,
        total_settled: (Number(totalSettled) / 100).toFixed(2),
        errors: errors.length > 0 ? errors : null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
