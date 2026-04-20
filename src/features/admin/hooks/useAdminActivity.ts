import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'

export type ActivityCategory =
  | 'signup'
  | 'payment'
  | 'lgpd'
  | 'workflow'
  | 'admin'
  | 'system'

export type ActivitySeverity = 'info' | 'success' | 'warning' | 'error'

export interface ActivityEvent {
  id: string
  category: ActivityCategory
  title: string
  description: string
  timestamp: string
  severity: ActivitySeverity
  link?: string
}

const LIMIT_PER_SOURCE = 15

export function useAdminActivity() {
  useRealtimeInvalidate({
    table: [
      'profiles',
      'invoices',
      'data_deletion_requests',
      'workflow_executions',
      'audit_logs',
      'system_logs',
    ],
    invalidate: [['admin-activity']],
    channelName: 'rt-admin-activity',
  })

  const query = useQuery({
    queryKey: ['admin-activity'],
    queryFn: async (): Promise<ActivityEvent[]> => {
      const [signups, payments, lgpd, workflows, audits, logs] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('id, email, full_name, created_at, plan')
            .order('created_at', { ascending: false })
            .limit(LIMIT_PER_SOURCE),
          supabase
            .from('invoices')
            .select(
              'id, amount, status, paid_at, created_at, invoice_number',
            )
            .in('status', ['paid', 'failed', 'overdue'])
            .order('created_at', { ascending: false })
            .limit(LIMIT_PER_SOURCE),
          supabase
            .from('data_deletion_requests')
            .select(
              'id, user_email, status, requested_at, executed_at, cancelled_at',
            )
            .order('requested_at', { ascending: false })
            .limit(LIMIT_PER_SOURCE),
          supabase
            .from('workflow_executions')
            .select('id, workflow_id, status, error, started_at, completed_at')
            .in('status', ['failed', 'completed'])
            .order('started_at', { ascending: false })
            .limit(LIMIT_PER_SOURCE),
          supabase
            .from('audit_logs')
            .select('id, action, table_name, record_id, created_at')
            .order('created_at', { ascending: false })
            .limit(LIMIT_PER_SOURCE),
          supabase
            .from('system_logs')
            .select('id, level, message, created_at')
            .in('level', ['error', 'warning'])
            .order('created_at', { ascending: false })
            .limit(LIMIT_PER_SOURCE),
        ])

      const events: ActivityEvent[] = []

      for (const p of signups.data ?? []) {
        if (!p.created_at) continue
        events.push({
          id: `signup-${p.id}`,
          category: 'signup',
          title: 'Novo cadastro',
          description: `${p.full_name ?? p.email ?? 'usuária'}${
            p.plan ? ` · ${p.plan}` : ''
          }`,
          timestamp: p.created_at,
          severity: 'info',
          link: '/admin?tab=usuarios',
        })
      }

      for (const inv of payments.data ?? []) {
        const ts = inv.paid_at ?? inv.created_at
        const isPaid = inv.status === 'paid'
        const isFailed = inv.status === 'failed' || inv.status === 'overdue'
        events.push({
          id: `invoice-${inv.id}`,
          category: 'payment',
          title: isPaid
            ? 'Pagamento recebido'
            : isFailed
              ? 'Pagamento falhou'
              : 'Invoice atualizada',
          description: `R$ ${Number(inv.amount).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
          })}${inv.invoice_number ? ` · #${inv.invoice_number}` : ''}`,
          timestamp: ts,
          severity: isPaid ? 'success' : isFailed ? 'error' : 'info',
          link: '/admin?tab=financeiro',
        })
      }

      for (const r of lgpd.data ?? []) {
        const ts = r.executed_at ?? r.cancelled_at ?? r.requested_at
        const title =
          r.status === 'executed'
            ? 'Conta excluída (LGPD)'
            : r.status === 'cancelled'
              ? 'Exclusão cancelada'
              : 'Exclusão agendada'
        const severity: ActivitySeverity =
          r.status === 'executed'
            ? 'error'
            : r.status === 'cancelled'
              ? 'info'
              : 'warning'
        events.push({
          id: `lgpd-${r.id}`,
          category: 'lgpd',
          title,
          description: r.user_email ?? 'usuária anônima',
          timestamp: ts,
          severity,
          link: '/admin?tab=overview',
        })
      }

      for (const w of workflows.data ?? []) {
        const ts = w.completed_at ?? w.started_at
        const isFailed = w.status === 'failed'
        events.push({
          id: `workflow-${w.id}`,
          category: 'workflow',
          title: isFailed ? 'Workflow falhou' : 'Workflow concluído',
          description: w.error
            ? w.error.slice(0, 140)
            : `workflow ${w.workflow_id.slice(0, 8)}`,
          timestamp: ts,
          severity: isFailed ? 'error' : 'success',
        })
      }

      for (const a of audits.data ?? []) {
        events.push({
          id: `audit-${a.id}`,
          category: 'admin',
          title: `${a.action.toUpperCase()} · ${a.table_name}`,
          description: `registro ${a.record_id.slice(0, 12)}`,
          timestamp: a.created_at,
          severity: 'info',
        })
      }

      for (const l of logs.data ?? []) {
        if (!l.created_at) continue
        const msg = l.message ?? ''
        events.push({
          id: `syslog-${l.id}`,
          category: 'system',
          title: `${(l.level ?? 'log').toUpperCase()}: ${msg.slice(0, 60)}`,
          description: msg.slice(60, 220),
          timestamp: l.created_at,
          severity: l.level === 'error' ? 'error' : 'warning',
        })
      }

      events.sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''))
      return events
    },
    staleTime: 1000 * 30,
  })

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}
