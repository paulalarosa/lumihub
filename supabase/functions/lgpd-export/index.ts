import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logEdgeError } from '../_shared/log-error.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

/**
 * LGPD (Lei Geral de Proteção de Dados) — user data export.
 * Any authenticated user can call this and get a JSON dump of ALL their data
 * across the tables they own. Meets LGPD Art. 18 (direito de portabilidade).
 *
 * Authentication: pass `user_token` in body (bypasses ES256 gateway issue).
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body = (await req.json().catch(() => ({}))) as {
      user_token?: string
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    const token =
      body.user_token ||
      (authHeader && authHeader !== anonKey ? authHeader : null)

    if (!token) return json({ error: 'Missing user token' }, 401)

    const { data: authData } = await sb.auth.getUser(token)
    const userId = authData?.user?.id
    if (!userId) return json({ error: 'Invalid token' }, 401)

    // Tables to export. Each query uses the resolved user_id so a user only
    // gets their own rows (no RLS leak — service role + explicit filter).
    const tables = [
      'profiles',
      'wedding_clients',
      'events',
      'projects',
      'contracts',
      'invoices',
      'transactions',
      'tasks',
      'notifications',
      'workflows',
      'workflow_executions',
      'leads',
      'user_ai_settings',
      'user_integrations',
      'assistants',
      'makeup_artists',
      'microsites',
      'audit_logs',
    ]

    const exported: Record<string, unknown[]> = {}

    for (const table of tables) {
      try {
        // profiles uses `id = user_id`, everyone else uses `user_id`
        const filterField = table === 'profiles' ? 'id' : 'user_id'
        const { data, error } = await sb
          .from(table)
          .select('*')
          .eq(filterField, userId)
        if (error) {
          exported[table] = [{ _error: error.message }]
          continue
        }
        exported[table] = data ?? []
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        exported[table] = [{ _error: msg }]
      }
    }

    // Auth metadata (email, phone, createdAt) — not in profiles
    const user = authData!.user!
    const payload = {
      generated_at: new Date().toISOString(),
      generated_by: 'lgpd-export',
      user_id: userId,
      account: {
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        confirmed_at: user.email_confirmed_at,
        provider: user.app_metadata?.provider,
        user_metadata: user.user_metadata,
      },
      data: exported,
      _meta: {
        lgpd_article: 'Art. 18, Lei 13.709/2018 — Direito de portabilidade',
        format: 'JSON',
      },
    }

    // Audit
    try {
      await sb.from('audit_logs').insert({
        user_id: userId,
        table_name: 'lgpd',
        action: 'DATA_EXPORT',
        new_data: {
          tables_exported: Object.keys(exported),
          row_count: Object.values(exported).reduce(
            (acc, v) => acc + (v?.length ?? 0),
            0,
          ),
        },
        source: 'edge_function',
      })
    } catch {
      // audit is best-effort
    }

    return json(payload)
  } catch (error) {
    await logEdgeError('lgpd-export', error)
    const msg = error instanceof Error ? error.message : String(error)
    return json({ error: msg }, 500)
  }
})
