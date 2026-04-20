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

type Action =
  | {
      type: 'send_email'
      to_from: 'payload_client_email' | 'literal'
      to?: string
      subject: string
      body: string
    }
  | {
      type: 'create_task'
      title: string
      due_in_days?: number
    }
  | {
      type: 'notify'
      channel: 'in_app'
      title: string
      message: string
    }
  | {
      type: 'send_push'
      title: string
      body: string
      url?: string
    }
  | {
      type: 'delay'
      minutes: number
    }

interface RunPayload {
  execution_id: string
  workflow_id: string
  actions: Action[]
  payload: Record<string, unknown>
}

const interpolate = (template: string, payload: Record<string, unknown>) =>
  template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, key) => {
    const parts = key.split('.')
    let val: unknown = payload
    for (const p of parts) {
      if (val && typeof val === 'object' && p in (val as object)) {
        val = (val as Record<string, unknown>)[p]
      } else {
        return ''
      }
    }
    return val == null ? '' : String(val)
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { execution_id, workflow_id, actions, payload } =
      (await req.json()) as RunPayload

    if (!execution_id || !workflow_id || !Array.isArray(actions)) {
      return json({ error: 'Invalid input' }, 400)
    }

    const errors: string[] = []

    for (const action of actions) {
      try {
        if (action.type === 'send_email') {
          let toEmail: string | null = null
          if (action.to_from === 'literal') {
            toEmail = action.to ?? null
          } else if (action.to_from === 'payload_client_email') {
            const clientId = (payload as Record<string, unknown>)
              .client_id as string | undefined
            if (clientId) {
              const { data: client } = await sb
                .from('wedding_clients')
                .select('email')
                .eq('id', clientId)
                .single()
              toEmail = client?.email ?? null
            }
          }

          if (!toEmail) {
            errors.push('send_email: no recipient resolved')
            continue
          }

          const { error } = await sb.functions.invoke('send-email', {
            body: {
              to: toEmail,
              subject: interpolate(action.subject, payload),
              html: interpolate(action.body, payload),
            },
          })
          if (error) errors.push(`send_email: ${error.message}`)
        } else if (action.type === 'create_task') {
          const { data: workflow } = await sb
            .from('workflows')
            .select('user_id')
            .eq('id', workflow_id)
            .single()
          if (!workflow) {
            errors.push('create_task: workflow not found')
            continue
          }
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + (action.due_in_days ?? 1))

          const { error } = await sb.from('tasks').insert({
            user_id: workflow.user_id,
            title: interpolate(action.title, payload),
            due_date: dueDate.toISOString(),
            status: 'pending',
          })
          if (error) errors.push(`create_task: ${error.message}`)
        } else if (action.type === 'notify') {
          const { data: workflow } = await sb
            .from('workflows')
            .select('user_id')
            .eq('id', workflow_id)
            .single()
          if (!workflow) {
            errors.push('notify: workflow not found')
            continue
          }
          const { error } = await sb.from('notifications').insert({
            user_id: workflow.user_id,
            title: interpolate(action.title, payload),
            message: interpolate(action.message, payload),
            type: 'workflow',
          })
          if (error) errors.push(`notify: ${error.message}`)
        } else if (action.type === 'send_push') {
          const { data: workflow } = await sb
            .from('workflows')
            .select('user_id')
            .eq('id', workflow_id)
            .single()
          if (!workflow) {
            errors.push('send_push: workflow not found')
            continue
          }
          const { error } = await sb.functions.invoke('send-push-notification', {
            body: {
              user_id: workflow.user_id,
              title: interpolate(action.title, payload),
              body: interpolate(action.body, payload),
              url: action.url ?? '/dashboard',
            },
          })
          if (error) errors.push(`send_push: ${error.message}`)
        } else if (action.type === 'delay') {
          await new Promise((r) =>
            setTimeout(r, Math.min(action.minutes * 60_000, 30_000)),
          )
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`action ${action.type}: ${msg}`)
      }
    }

    await sb
      .from('workflow_executions')
      .update({
        status: errors.length > 0 ? 'partial_failure' : 'success',
        error: errors.length > 0 ? errors.join(' | ') : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', execution_id)

    return json({ success: errors.length === 0, errors })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return json({ error: msg }, 500)
  }
})
