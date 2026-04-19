import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface TopUser {
  user_id: string
  full_name: string | null
  email: string | null
  plan_type: string | null
  plan_status: string | null
  monthly_price: number | null
  clients_count: number
  projects_count: number
  events_count: number
  revenue_generated: number
  last_active_at: string | null
}

export function useTopUsers(limit = 20) {
  return useQuery({
    queryKey: ['admin-top-users', limit],
    queryFn: async (): Promise<TopUser[]> => {
      const { data: artists, error: artistsError } = await supabase
        .from('makeup_artists')
        .select(
          'user_id, plan_type, plan_status, monthly_price, plan_started_at, updated_at',
        )
        .in('plan_status', ['active', 'trialing'])
        .limit(100)

      if (artistsError) throw artistsError
      if (!artists || artists.length === 0) return []

      const userIds = artists.map((a) => a.user_id).filter(Boolean) as string[]
      if (userIds.length === 0) return []

      const [{ data: profiles }, clientCounts, projectStats, eventCounts] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds),
          countByUser('wedding_clients', userIds),
          sumProjectsByUser(userIds),
          countByUser('events', userIds),
        ])

      const profileMap: Record<string, { full_name: string | null; email: string | null }> = {}
      ;(profiles ?? []).forEach((p) => {
        profileMap[p.id] = { full_name: p.full_name, email: p.email }
      })

      const rows: TopUser[] = artists
        .map((a) => {
          if (!a.user_id) return null
          const profile = profileMap[a.user_id] ?? { full_name: null, email: null }
          const revenue = projectStats.revenue[a.user_id] ?? 0
          return {
            user_id: a.user_id,
            full_name: profile.full_name,
            email: profile.email,
            plan_type: a.plan_type,
            plan_status: a.plan_status,
            monthly_price: a.monthly_price,
            clients_count: clientCounts[a.user_id] ?? 0,
            projects_count: projectStats.count[a.user_id] ?? 0,
            events_count: eventCounts[a.user_id] ?? 0,
            revenue_generated: revenue,
            last_active_at: a.updated_at,
          }
        })
        .filter((r): r is TopUser => r !== null)
        .sort((a, b) => b.revenue_generated - a.revenue_generated)
        .slice(0, limit)

      return rows
    },
    staleTime: 5 * 60 * 1000,
  })
}

async function countByUser(
  table: 'wedding_clients' | 'events',
  userIds: string[],
): Promise<Record<string, number>> {
  const { data } = await supabase
    .from(table)
    .select('user_id')
    .in('user_id', userIds)
  const counts: Record<string, number> = {}
  ;(data ?? []).forEach((row) => {
    if (row.user_id) counts[row.user_id] = (counts[row.user_id] ?? 0) + 1
  })
  return counts
}

async function sumProjectsByUser(
  userIds: string[],
): Promise<{ count: Record<string, number>; revenue: Record<string, number> }> {
  const { data } = await supabase
    .from('projects')
    .select('user_id, total_value, total_budget, budget')
    .in('user_id', userIds)
  const count: Record<string, number> = {}
  const revenue: Record<string, number> = {}
  ;(data ?? []).forEach((row) => {
    if (!row.user_id) return
    count[row.user_id] = (count[row.user_id] ?? 0) + 1
    const value =
      row.total_value ?? row.total_budget ?? row.budget ?? 0
    revenue[row.user_id] = (revenue[row.user_id] ?? 0) + Number(value || 0)
  })
  return { count, revenue }
}
