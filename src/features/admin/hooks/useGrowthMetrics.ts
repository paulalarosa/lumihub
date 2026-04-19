import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface MonthlyPoint {
  label: string
  signups: number
  active: number
  revenue: number
}

export interface PlanDistribution {
  plan: string
  count: number
  mrr: number
  color: string
}

export interface FunnelStage {
  stage: string
  count: number
  percentage: number
}

export interface GrowthMetrics {
  monthly: MonthlyPoint[]
  plans: PlanDistribution[]
  funnel: FunnelStage[]
  totalSignups: number
  totalPaying: number
  churnRate30d: number
}

const PLAN_COLORS: Record<string, string> = {
  essencial: '#8b8b8b',
  profissional: '#ffffff',
  studio: '#facc15',
}

const PLAN_PRICES: Record<string, number> = {
  essencial: 49.9,
  profissional: 99.9,
  studio: 199.9,
}

const MONTH_LABEL = (d: Date) =>
  d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase()

export function useGrowthMetrics() {
  return useQuery({
    queryKey: ['admin-growth-metrics'],
    queryFn: async (): Promise<GrowthMetrics> => {
      const now = new Date()
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

      const [{ data: artists }, { data: cancellations }] = await Promise.all([
        supabase
          .from('makeup_artists')
          .select('plan_type, plan_status, created_at, plan_started_at, monthly_price, plan_expires_at'),
        supabase
          .from('makeup_artists')
          .select('id, plan_expires_at')
          .eq('plan_status', 'cancelled')
          .gte('plan_expires_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ])

      const rows = artists ?? []

      const monthlyBuckets = new Map<string, { signups: number; active: number; revenue: number }>()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        monthlyBuckets.set(MONTH_LABEL(d), { signups: 0, active: 0, revenue: 0 })
      }

      let totalSignups = 0
      let totalPaying = 0
      const planCounts: Record<string, { count: number; mrr: number }> = {}

      for (const a of rows) {
        if (!a.created_at) continue
        const createdAt = new Date(a.created_at)
        totalSignups += 1

        if (createdAt >= sixMonthsAgo) {
          const key = MONTH_LABEL(createdAt)
          const bucket = monthlyBuckets.get(key)
          if (bucket) bucket.signups += 1
        }

        const isActiveOrTrial =
          a.plan_status === 'active' || a.plan_status === 'trialing'
        if (a.plan_type && a.plan_type !== 'essencial' && isActiveOrTrial) {
          totalPaying += 1
          const price = a.monthly_price ?? PLAN_PRICES[a.plan_type] ?? 0
          if (!planCounts[a.plan_type]) {
            planCounts[a.plan_type] = { count: 0, mrr: 0 }
          }
          planCounts[a.plan_type].count += 1
          planCounts[a.plan_type].mrr += price
        }

        if (a.plan_started_at && isActiveOrTrial) {
          const startedAt = new Date(a.plan_started_at)
          monthlyBuckets.forEach((bucket, key) => {
            const [m, y] = key.split(' ')
            const bucketDate = parseMonthLabel(m, y)
            const endOfBucket = new Date(
              bucketDate.getFullYear(),
              bucketDate.getMonth() + 1,
              0,
            )
            if (startedAt <= endOfBucket) {
              bucket.active += 1
              bucket.revenue += a.monthly_price ?? PLAN_PRICES[a.plan_type ?? ''] ?? 0
            }
          })
        }
      }

      const plans: PlanDistribution[] = Object.entries(planCounts).map(
        ([plan, v]) => ({
          plan,
          count: v.count,
          mrr: v.mrr,
          color: PLAN_COLORS[plan] ?? '#666',
        }),
      )

      const totalTrials = rows.filter(
        (a) => a.plan_status === 'trialing',
      ).length
      const totalActive = rows.filter((a) => a.plan_status === 'active').length

      const funnel: FunnelStage[] = [
        { stage: 'Cadastros', count: totalSignups, percentage: 100 },
        {
          stage: 'Em trial',
          count: totalTrials,
          percentage: totalSignups > 0 ? (totalTrials / totalSignups) * 100 : 0,
        },
        {
          stage: 'Pagantes',
          count: totalActive,
          percentage: totalSignups > 0 ? (totalActive / totalSignups) * 100 : 0,
        },
      ]

      const churnBase = totalActive + (cancellations?.length ?? 0)
      const churnRate30d =
        churnBase > 0 ? ((cancellations?.length ?? 0) / churnBase) * 100 : 0

      const monthly: MonthlyPoint[] = Array.from(monthlyBuckets.entries()).map(
        ([label, v]) => ({
          label,
          signups: v.signups,
          active: v.active,
          revenue: Math.round(v.revenue),
        }),
      )

      return {
        monthly,
        plans,
        funnel,
        totalSignups,
        totalPaying,
        churnRate30d: Math.round(churnRate30d * 10) / 10,
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

function parseMonthLabel(m: string, y: string): Date {
  const months: Record<string, number> = {
    'JAN.': 0,
    'FEV.': 1,
    'MAR.': 2,
    'ABR.': 3,
    'MAI.': 4,
    'JUN.': 5,
    'JUL.': 6,
    'AGO.': 7,
    'SET.': 8,
    'OUT.': 9,
    'NOV.': 10,
    'DEZ.': 11,
  }
  const year = 2000 + parseInt(y, 10)
  const month = months[m.toUpperCase()] ?? 0
  return new Date(year, month, 1)
}
