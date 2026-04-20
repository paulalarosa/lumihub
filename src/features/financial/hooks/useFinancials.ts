import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { subMonths } from 'date-fns/subMonths'
import { formatDate, toZonedTime } from '@/lib/date-utils'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  payment_method: string
  created_at: string
}

export const useFinancials = () => {
  const { user } = useAuth()
  const { organizationId } = useOrganization()

  useRealtimeInvalidate({
    table: ['invoices', 'payments'],
    invalidate: ['financial-transactions'],
    filter: organizationId ? `user_id=eq.${organizationId}` : undefined,
    enabled: !!organizationId,
    channelName: 'rt-financials',
  })

  const query = useQuery({
    queryKey: ['financial-transactions', organizationId],
    queryFn: async () => {
      if (!organizationId) return []

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', organizationId)
        .order('date', { ascending: false })

      if (error) throw error
      return data as Transaction[]
    },
    enabled: !!user,
  })

  const transactions = query.data || []

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0)

  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0)

  const profit = income - expense

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(toZonedTime(new Date()), i)
    return {
      month: formatDate(d, 'MMM').toUpperCase(),
      fullDate: d,
      income: 0,
      expense: 0,
    }
  }).reverse()

  transactions.forEach((tx) => {
    const txDate = toZonedTime(tx.date)
    const monthEntry = chartData.find(
      (m) =>
        txDate.getMonth() === m.fullDate.getMonth() &&
        txDate.getFullYear() === m.fullDate.getFullYear(),
    )
    if (monthEntry) {
      if (tx.type === 'income') monthEntry.income += Number(tx.amount)
      if (tx.type === 'expense') monthEntry.expense += Number(tx.amount)
    }
  })

  return {
    transactions,
    metrics: { income, expense, profit },
    chartData,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
