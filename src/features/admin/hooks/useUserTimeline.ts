import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export type TimelineEventType =
  | 'audit'
  | 'notification'
  | 'email'
  | 'invoice'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  title: string
  description: string | null
  timestamp: string
  metadata?: Record<string, unknown>
}

export function useUserTimeline(userId: string | null, limit = 40) {
  return useQuery({
    queryKey: ['admin-user-timeline', userId, limit],
    queryFn: async (): Promise<TimelineEvent[]> => {
      if (!userId) return []

      const [audits, notifs, emails, invoices] = await Promise.all([
        supabase
          .from('audit_logs')
          .select('id, action, table_name, record_id, source, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('notifications')
          .select('id, type, title, message, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('notification_logs')
          .select('id, type, recipient, status, metadata, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('invoices')
          .select('id, invoice_number, amount, status, created_at, paid_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      const events: TimelineEvent[] = []

      ;(audits.data ?? []).forEach((a) => {
        events.push({
          id: `audit-${a.id}`,
          type: 'audit',
          title: `${a.action} em ${a.table_name}`,
          description: a.source ?? null,
          timestamp: a.created_at,
          metadata: { record_id: a.record_id },
        })
      })

      ;(notifs.data ?? []).forEach((n) => {
        events.push({
          id: `notif-${n.id}`,
          type: 'notification',
          title: n.title,
          description: n.message,
          timestamp: n.created_at ?? new Date().toISOString(),
          metadata: { notificationType: n.type },
        })
      })

      ;(emails.data ?? []).forEach((e) => {
        const meta = (e.metadata as Record<string, unknown>) ?? {}
        const template = (meta.template as string) ?? ''
        events.push({
          id: `email-${e.id}`,
          type: 'email',
          title: `Email: ${template || e.type}`,
          description: `${e.status} · ${e.recipient}`,
          timestamp: e.created_at ?? new Date().toISOString(),
        })
      })

      ;(invoices.data ?? []).forEach((inv) => {
        if (inv.paid_at) {
          events.push({
            id: `inv-paid-${inv.id}`,
            type: 'invoice',
            title: `Fatura paga: ${inv.invoice_number ?? inv.id.slice(0, 8)}`,
            description: `R$ ${Number(inv.amount).toFixed(2)}`,
            timestamp: inv.paid_at,
          })
        }
        events.push({
          id: `inv-created-${inv.id}`,
          type: 'invoice',
          title: `Fatura gerada: ${inv.invoice_number ?? inv.id.slice(0, 8)}`,
          description: `R$ ${Number(inv.amount).toFixed(2)} · ${inv.status ?? 'pending'}`,
          timestamp: inv.created_at,
        })
      })

      events.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )

      return events.slice(0, limit)
    },
    enabled: !!userId,
    staleTime: 60_000,
  })
}
