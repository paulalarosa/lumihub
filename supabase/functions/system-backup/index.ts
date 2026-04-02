import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupData: any = {}

    const tables = [
      'profiles',
      'projects',
      'clients',
      'financial_records',
      'calendar_events',
      'message_templates',
    ]

    for (const table of tables) {
      const { data, error } = await supabaseClient.from(table).select('*')

      if (error) {
        throw error
      }

      backupData[table] = data
    }

    const backupContent = JSON.stringify(backupData, null, 2)
    const fileName = `backup-${timestamp}.json`

    const { error: uploadError } = await supabaseClient.storage
      .from('system_backups')
      .upload(fileName, backupContent, {
        contentType: 'application/json',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    return new Response(
      JSON.stringify({
        success: true,
        file: fileName,
        sizes: Object.fromEntries(tables.map((t) => [t, backupData[t].length])),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
