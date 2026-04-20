import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'

export interface AdminBrideRow {
  id: string
  full_name: string | null
  name: string | null
  email: string | null
  phone: string | null
  wedding_date: string | null
  portal_link: string | null
  created_at: string | null
  status: string | null
  is_bride: boolean | null
  user_id: string | null
  origin_business: string | null
  origin_email: string | null
}

export function useAdminBrides() {
  useRealtimeInvalidate({
    table: ['wedding_clients', 'makeup_artists'],
    invalidate: [['admin-brides']],
    channelName: 'rt-admin-brides',
  })

  const query = useQuery({
    queryKey: ['admin-brides'],
    queryFn: async (): Promise<AdminBrideRow[]> => {
      const { data: clients, error } = await supabase
        .from('wedding_clients')
        .select(
          'id, full_name, name, email, phone, wedding_date, portal_link, created_at, status, is_bride, user_id',
        )
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw error

      const userIds = Array.from(
        new Set(
          (clients ?? [])
            .map((c) => c.user_id)
            .filter((id): id is string => !!id),
        ),
      )

      const artistsByUserId: Record<
        string,
        { business_name: string | null }
      > = {}
      const profilesByUserId: Record<string, { email: string | null }> = {}

      if (userIds.length > 0) {
        const [{ data: artists }, { data: profiles }] = await Promise.all([
          supabase
            .from('makeup_artists')
            .select('user_id, business_name')
            .in('user_id', userIds),
          supabase
            .from('profiles')
            .select('id, email')
            .in('id', userIds),
        ])

        for (const a of artists ?? []) {
          if (a.user_id) {
            artistsByUserId[a.user_id] = { business_name: a.business_name }
          }
        }
        for (const p of profiles ?? []) {
          profilesByUserId[p.id] = { email: p.email }
        }
      }

      return (clients ?? []).map((c) => ({
        id: c.id,
        full_name: c.full_name,
        name: c.name,
        email: c.email,
        phone: c.phone,
        wedding_date: c.wedding_date,
        portal_link: c.portal_link,
        created_at: c.created_at,
        status: c.status,
        is_bride: c.is_bride,
        user_id: c.user_id,
        origin_business: c.user_id
          ? (artistsByUserId[c.user_id]?.business_name ?? null)
          : null,
        origin_email: c.user_id
          ? (profilesByUserId[c.user_id]?.email ?? null)
          : null,
      }))
    },
  })

  return {
    brides: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}
