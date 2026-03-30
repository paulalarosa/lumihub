import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface AssistantEarnings {
  thisMonth: number
  lastMonth: number
  totalEarned: number
  totalEvents: number
}

export function useAssistantEarnings(assistantId: string | undefined) {
  return useQuery<AssistantEarnings>({
    queryKey: ['assistant-earnings', assistantId],
    queryFn: async () => {
      if (!assistantId)
        return { thisMonth: 0, lastMonth: 0, totalEarned: 0, totalEvents: 0 }

      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString()
        .split('T')[0]
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        .toISOString()
        .split('T')[0]
      const today = now.toISOString().split('T')[0]

      const [thisMonthRes, lastMonthRes, totalRes] = await Promise.all([
        supabase.rpc(
          'calculate_assistant_earnings' as never,
          {
            p_assistant_id: assistantId,
            p_start_date: thisMonthStart,
            p_end_date: today,
          } as never,
        ),
        supabase.rpc(
          'calculate_assistant_earnings' as never,
          {
            p_assistant_id: assistantId,
            p_start_date: lastMonthStart,
            p_end_date: lastMonthEnd,
          } as never,
        ),
        supabase.rpc(
          'calculate_assistant_earnings' as never,
          {
            p_assistant_id: assistantId,
            p_start_date: '2020-01-01',
            p_end_date: today,
          } as never,
        ),
      ])

      type EarningsRow = { commission_amount: number; total_events: number }

      return {
        thisMonth:
          (thisMonthRes.data as EarningsRow[] | null)?.[0]?.commission_amount ??
          0,
        lastMonth:
          (lastMonthRes.data as EarningsRow[] | null)?.[0]?.commission_amount ??
          0,
        totalEarned:
          (totalRes.data as EarningsRow[] | null)?.[0]?.commission_amount ?? 0,
        totalEvents:
          (thisMonthRes.data as EarningsRow[] | null)?.[0]?.total_events ?? 0,
      }
    },
    enabled: !!assistantId,
    staleTime: 5 * 60 * 1000,
  })
}
