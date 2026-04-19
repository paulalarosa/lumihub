import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface MonthlyFinancialSummary {
  period: string
  startIso: string
  endIso: string
  invoicesTotal: number
  invoicesPaid: number
  invoicesPending: number
  invoicesCancelled: number
  revenueGross: number
  revenueNet: number
  refundsCount: number
  refundsValue: number
  planBreakdown: Array<{
    plan: string
    subscribers: number
    mrr: number
  }>
  topUsers: Array<{
    user_id: string
    full_name: string | null
    email: string | null
    revenue: number
    paid: number
  }>
  dailySeries: Array<{ day: string; amount: number }>
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function monthRange(year: number, monthIndex: number) {
  const start = new Date(year, monthIndex, 1, 0, 0, 0)
  const end = new Date(year, monthIndex + 1, 1, 0, 0, 0)
  const label = start.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
  return {
    label: label.charAt(0).toUpperCase() + label.slice(1),
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

export function useMonthlyFinancials(year: number, monthIndex: number) {
  return useQuery({
    queryKey: ['admin-monthly-financials', year, monthIndex],
    queryFn: async (): Promise<MonthlyFinancialSummary> => {
      const { label, startIso, endIso } = monthRange(year, monthIndex)

      const [{ data: invoices }, { data: artists }] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, user_id, amount, status, created_at, paid_at')
          .gte('created_at', startIso)
          .lt('created_at', endIso),
        supabase
          .from('makeup_artists')
          .select('user_id, plan_type, plan_status, monthly_price'),
      ])

      const invoiceRows = invoices ?? []

      const invoicesPaidRows = invoiceRows.filter((i) => i.status === 'paid')
      const invoicesPendingRows = invoiceRows.filter(
        (i) => i.status === 'pending' || i.status === 'open',
      )
      const invoicesCancelledRows = invoiceRows.filter(
        (i) => i.status === 'cancelled' || i.status === 'refunded',
      )

      const revenueGross = invoiceRows.reduce((acc, i) => acc + Number(i.amount), 0)
      const revenueNet = invoicesPaidRows.reduce(
        (acc, i) => acc + Number(i.amount),
        0,
      )
      const refundsValue = invoicesCancelledRows.reduce(
        (acc, i) => acc + Number(i.amount),
        0,
      )

      const userRevenue = new Map<string, { revenue: number; paid: number }>()
      invoiceRows.forEach((i) => {
        if (!i.user_id) return
        const bucket = userRevenue.get(i.user_id) ?? { revenue: 0, paid: 0 }
        bucket.revenue += Number(i.amount)
        if (i.status === 'paid') bucket.paid += Number(i.amount)
        userRevenue.set(i.user_id, bucket)
      })

      const topUserIds = [...userRevenue.entries()]
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([id]) => id)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', topUserIds)

      const profileMap: Record<string, { full_name: string | null; email: string | null }> = {}
      ;(profiles ?? []).forEach((p) => {
        profileMap[p.id] = { full_name: p.full_name, email: p.email }
      })

      const topUsers = topUserIds.map((id) => {
        const bucket = userRevenue.get(id)!
        const profile = profileMap[id] ?? { full_name: null, email: null }
        return {
          user_id: id,
          full_name: profile.full_name,
          email: profile.email,
          revenue: bucket.revenue,
          paid: bucket.paid,
        }
      })

      const planMap = new Map<string, { subscribers: number; mrr: number }>()
      ;(artists ?? []).forEach((a) => {
        if (!a.plan_type) return
        if (a.plan_status !== 'active' && a.plan_status !== 'trialing') return
        const bucket = planMap.get(a.plan_type) ?? { subscribers: 0, mrr: 0 }
        bucket.subscribers += 1
        bucket.mrr += Number(a.monthly_price ?? 0)
        planMap.set(a.plan_type, bucket)
      })

      const planBreakdown = [...planMap.entries()]
        .map(([plan, v]) => ({ plan, ...v }))
        .sort((a, b) => b.mrr - a.mrr)

      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
      const daily: Record<string, number> = {}
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${year}-${pad(monthIndex + 1)}-${pad(d)}`
        daily[key] = 0
      }
      invoicesPaidRows.forEach((i) => {
        const day = (i.paid_at ?? i.created_at).slice(0, 10)
        if (daily[day] != null) daily[day] += Number(i.amount)
      })
      const dailySeries = Object.entries(daily).map(([day, amount]) => ({
        day,
        amount,
      }))

      return {
        period: label,
        startIso,
        endIso,
        invoicesTotal: invoiceRows.length,
        invoicesPaid: invoicesPaidRows.length,
        invoicesPending: invoicesPendingRows.length,
        invoicesCancelled: invoicesCancelledRows.length,
        revenueGross,
        revenueNet,
        refundsCount: invoicesCancelledRows.length,
        refundsValue,
        planBreakdown,
        topUsers,
        dailySeries,
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
