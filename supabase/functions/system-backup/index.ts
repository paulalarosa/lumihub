import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        console.log("System_Backup_Protocol: Initiating...");

        // 1. Verify Admin (Optional: if called from client, but usually this is a cron job)
        // For cron, we trust the execution context if it's internal.
        // However, if exposed via API, we should check for a secret or admin user.
        // For now, assuming this is triggered by a secure mechanism (Cron or Admin Dashboard).

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupData: any = {};

        // 2. Fetch Critical Data Tables
        const tables = ['profiles', 'projects', 'clients', 'financial_records', 'calendar_events', 'message_templates'];

        for (const table of tables) {
            console.log(`System_Backup_Protocol: Archiving table [${table}]...`);
            const { data, error } = await supabaseClient.from(table).select('*');

            if (error) {
                console.error(`System_Backup_Protocol: Failure on [${table}]`, error);
                throw error;
            }

            backupData[table] = data;
        }

        // 3. Serialize
        const backupContent = JSON.stringify(backupData, null, 2);
        const fileName = `backup-${timestamp}.json`;

        // 4. Upload to Storage
        const { error: uploadError } = await supabaseClient
            .storage
            .from('system_backups')
            .upload(fileName, backupContent, {
                contentType: 'application/json',
                upsert: false
            });

        if (uploadError) {
            console.error('System_Backup_Protocol: Upload Failure', uploadError);
            throw uploadError;
        }

        console.log(`System_Backup_Protocol: Success. Archived to [${fileName}]`);

        return new Response(
            JSON.stringify({ success: true, file: fileName, sizes: Object.fromEntries(tables.map(t => [t, backupData[t].length])) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('System_Backup_Protocol: CRITICAL_FAILURE', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
