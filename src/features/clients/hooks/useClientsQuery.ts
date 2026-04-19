import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useClientFilterStore } from '@/stores/useClientFilterStore'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'

import { Client as GlobalClient } from '@/types/api.types'

export type Client = GlobalClient

interface UseClientsQueryOptions {
  enabled?: boolean
}

export function useClientsQuery(options: UseClientsQueryOptions = {}) {
  const { user } = useAuth()
  const { organizationId } = useOrganization()
  const queryClient = useQueryClient()

  const { search, status, dateRange, company, sortBy } = useClientFilterStore()

  useEffect(() => {
    if (!organizationId) return

    const channel = supabase
      .channel('clients-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wedding_clients',
          filter: `user_id=eq.${organizationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['clients'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId, queryClient])

  const queryKey = [
    'clients',
    organizationId,
    search,
    status,
    dateRange.from?.toISOString(),
    dateRange.to?.toISOString(),
    company,
    sortBy,
  ]

  const query = useQuery<Client[]>({
    queryKey,
    queryFn: async (): Promise<Client[]> => {
      if (!organizationId) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let baseQuery: any = supabase
        .from('wedding_clients')
        .select('*')
        .eq('user_id', organizationId)

      if (search) {
        baseQuery = baseQuery.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
        )
      }

      if (status === 'active') {
        baseQuery = baseQuery.eq('status', 'active')
      } else if (status === 'inactive') {
        baseQuery = baseQuery.eq('status', 'inactive')
      }

      if (dateRange.from) {
        baseQuery = baseQuery.gte('created_at', dateRange.from.toISOString())
      }

      if (dateRange.to) {
        const endOfDay = new Date(dateRange.to)
        endOfDay.setHours(23, 59, 59, 999)
        baseQuery = baseQuery.lte('created_at', endOfDay.toISOString())
      }

      if (company) {
        baseQuery = baseQuery.eq('company', company)
      }

      switch (sortBy) {
        case 'name_asc':
          baseQuery = baseQuery.order('name', { ascending: true })
          break
        case 'name_desc':
          baseQuery = baseQuery.order('name', { ascending: false })
          break
        case 'date_desc':
          baseQuery = baseQuery.order('created_at', { ascending: false })
          break
        case 'date_asc':
          baseQuery = baseQuery.order('created_at', { ascending: true })
          break
        default:
          baseQuery = baseQuery.order('name', { ascending: true })
      }

      const { data, error } = await baseQuery

      if (error) throw error
      return data || []
    },
    enabled: !!user && !!organizationId && options.enabled !== false,
    staleTime: 1000 * 60 * 5,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] })
  }

  const refetch = () => {
    query.refetch()
  }

  return {
    clients: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  }
}
