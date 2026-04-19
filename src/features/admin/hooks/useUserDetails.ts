import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface UserDetails {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string | null
  created_at: string | null
  plan_type: string | null
  plan_status: string | null
  monthly_price: number | null
  plan_started_at: string | null
  plan_expires_at: string | null
  trial_ends_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  business_name: string | null
  counters: {
    clients: number
    projects: number
    events: number
    contracts: number
    invoices: number
    assistants: number
  }
  revenue: {
    total: number
    paid: number
    pending: number
  }
  recentInvoices: Array<{
    id: string
    invoice_number: string | null
    amount: number
    status: string | null
    created_at: string
  }>
  lastSignIn: string | null
}

export function useUserDetails(userId: string | null) {
  return useQuery({
    queryKey: ['admin-user-details', userId],
    queryFn: async (): Promise<UserDetails | null> => {
      if (!userId) return null

      const [
        { data: profile },
        { data: artist },
        clientsCount,
        projectsCount,
        eventsCount,
        contractsCount,
        assistantsCount,
        { data: invoices },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, phone, role, created_at')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('makeup_artists')
          .select(
            'plan_type, plan_status, monthly_price, plan_started_at, plan_expires_at, trial_ends_at, stripe_customer_id, stripe_subscription_id, business_name',
          )
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('wedding_clients')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('contracts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('assistants')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('invoices')
          .select('id, invoice_number, amount, status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      if (!profile) return null

      const invoiceRows = invoices ?? []
      const totalRevenue = invoiceRows.reduce((acc, i) => acc + Number(i.amount), 0)
      const paidRevenue = invoiceRows
        .filter((i) => i.status === 'paid')
        .reduce((acc, i) => acc + Number(i.amount), 0)
      const pendingRevenue = invoiceRows
        .filter((i) => i.status === 'pending' || i.status === 'open')
        .reduce((acc, i) => acc + Number(i.amount), 0)

      return {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        created_at: profile.created_at,
        plan_type: artist?.plan_type ?? null,
        plan_status: artist?.plan_status ?? null,
        monthly_price: artist?.monthly_price ?? null,
        plan_started_at: artist?.plan_started_at ?? null,
        plan_expires_at: artist?.plan_expires_at ?? null,
        trial_ends_at: artist?.trial_ends_at ?? null,
        stripe_customer_id: artist?.stripe_customer_id ?? null,
        stripe_subscription_id: artist?.stripe_subscription_id ?? null,
        business_name: artist?.business_name ?? null,
        counters: {
          clients: clientsCount.count ?? 0,
          projects: projectsCount.count ?? 0,
          events: eventsCount.count ?? 0,
          contracts: contractsCount.count ?? 0,
          invoices: invoiceRows.length,
          assistants: assistantsCount.count ?? 0,
        },
        revenue: {
          total: totalRevenue,
          paid: paidRevenue,
          pending: pendingRevenue,
        },
        recentInvoices: invoiceRows,
        lastSignIn: null,
      }
    },
    enabled: !!userId,
    staleTime: 60_000,
  })
}
