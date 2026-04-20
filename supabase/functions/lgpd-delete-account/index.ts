import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
 * LGPD Art. 18 II — direito à eliminação.
 * User requests deletion → creates a row in `data_deletion_requests`
 * with 7-day grace period (so it's cancelable + auditable).
 * After grace, a cron job or manual admin action purges the auth.users
 * row which cascades to all owned data via FKs + RLS.
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
      action?: 'request' | 'cancel' | 'confirm'
      reason?: string
      confirmation_text?: string
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const bearer = req.headers.get('Authorization')?.replace('Bearer ', '')
    const token =
      body.user_token || (bearer && bearer !== anonKey ? bearer : null)
    if (!token) return json({ error: 'Missing user token' }, 401)

    const { data: authData } = await sb.auth.getUser(token)
    const userId = authData?.user?.id
    const userEmail = authData?.user?.email
    if (!userId) return json({ error: 'Invalid token' }, 401)

    const action = body.action ?? 'request'

    if (action === 'request') {
      // Check if already has a pending request
      const { data: existing } = await sb
        .from('data_deletion_requests')
        .select('id, status, scheduled_for')
        .eq('user_id', userId)
        .in('status', ['pending', 'scheduled'])
        .maybeSingle()

      if (existing) {
        return json({
          status: 'already_pending',
          request_id: existing.id,
          scheduled_for: existing.scheduled_for,
        })
      }

      const scheduledFor = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const { data: inserted, error } = await sb
        .from('data_deletion_requests')
        .insert({
          user_id: userId,
          user_email: userEmail,
          reason: body.reason ?? null,
          status: 'scheduled',
          requested_at: new Date().toISOString(),
          scheduled_for: scheduledFor.toISOString(),
        })
        .select('id')
        .single()

      if (error) return json({ error: `DB: ${error.message}` }, 500)

      return json({
        status: 'scheduled',
        request_id: inserted.id,
        scheduled_for: scheduledFor.toISOString(),
        grace_days: 7,
      })
    }

    if (action === 'cancel') {
      const { error } = await sb
        .from('data_deletion_requests')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .in('status', ['pending', 'scheduled'])

      if (error) return json({ error: `DB: ${error.message}` }, 500)
      return json({ status: 'cancelled' })
    }

    if (action === 'confirm') {
      // Immediate deletion — requires user to type their email as confirmation
      if (body.confirmation_text !== userEmail) {
        return json(
          { error: 'Confirmation text must match your account email' },
          400,
        )
      }

      // Mark request as executed, then purge auth user (cascades to rows with user_id FK + on delete cascade)
      await sb
        .from('data_deletion_requests')
        .update({
          status: 'executed',
          executed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      const { error: delErr } = await sb.auth.admin.deleteUser(userId)
      if (delErr) return json({ error: `Delete failed: ${delErr.message}` }, 500)

      return json({ status: 'deleted', user_id: userId })
    }

    return json({ error: `Unknown action: ${action}` }, 400)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return json({ error: msg }, 500)
  }
})
