import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MarketingService, MarketingCampaign } from '@/services/marketing'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'
import { differenceInDays } from 'date-fns/differenceInDays'
import { logger } from '@/services/logger'

export type InactivityBucket = 'all' | '45-60' | '60-90' | '90+'

export interface InactiveClient {
  id: string
  name: string
  phone: string | null
  created_at: string
  days_since_created: number
  last_contacted_at: string | null
  days_since_contacted: number | null
}

export interface ContactLogEntry {
  id: string
  client_id: string
  client_name: string
  channel: string
  template_title: string | null
  message_preview: string | null
  contacted_at: string
}

const CONTACT_SUPPRESSION_DAYS = 14

export const useMarketing = () => {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await MarketingService.getAll()
      setCampaigns(data)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      logger.error(error, {
        message: 'Erro ao carregar campanhas de marketing.',
      })
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  return {
    campaigns,
    loading,
    error,
    refetch: fetchCampaigns,
  }
}

export const useInactiveClients = (bucket: InactivityBucket = 'all') => {
  const { organizationId } = useOrganization()

  const query = useQuery({
    queryKey: ['marketing', 'inactive-clients', organizationId, bucket],
    queryFn: async (): Promise<InactiveClient[]> => {
      if (!organizationId) return []

      const [clientsRes, logsRes] = await Promise.all([
        supabase
          .from('wedding_clients')
          .select('id, full_name, phone, created_at, projects(status)')
          .eq('user_id', organizationId),
        supabase
          .from('marketing_contacts_log')
          .select('client_id, contacted_at')
          .eq('user_id', organizationId)
          .order('contacted_at', { ascending: false }),
      ])

      if (clientsRes.error) throw clientsRes.error
      if (logsRes.error) throw logsRes.error

      const lastContactMap = new Map<string, string>()
      ;(logsRes.data ?? []).forEach((log) => {
        if (!lastContactMap.has(log.client_id)) {
          lastContactMap.set(log.client_id, log.contacted_at)
        }
      })

      const now = new Date()
      const processed: InactiveClient[] = []

      for (const c of clientsRes.data ?? []) {
        const daysSinceCreated = differenceInDays(now, new Date(c.created_at))
        const hasActiveProject = (c.projects as { status: string }[] | null)?.some(
          (p) => p.status === 'active' || p.status === 'ongoing',
        )
        if (daysSinceCreated <= 45 || hasActiveProject) continue

        const lastContact = lastContactMap.get(c.id) ?? null
        const daysSinceContacted = lastContact
          ? differenceInDays(now, new Date(lastContact))
          : null

        if (daysSinceContacted !== null && daysSinceContacted < CONTACT_SUPPRESSION_DAYS) {
          continue
        }

        if (bucket === '45-60' && (daysSinceCreated < 45 || daysSinceCreated > 60)) continue
        if (bucket === '60-90' && (daysSinceCreated < 60 || daysSinceCreated > 90)) continue
        if (bucket === '90+' && daysSinceCreated < 90) continue

        processed.push({
          id: c.id,
          name: c.full_name,
          phone: c.phone,
          created_at: c.created_at,
          days_since_created: daysSinceCreated,
          last_contacted_at: lastContact,
          days_since_contacted: daysSinceContacted,
        })
      }

      return processed.sort((a, b) => b.days_since_created - a.days_since_created)
    },
    enabled: !!organizationId,
    staleTime: 60_000,
  })

  return {
    clients: query.data ?? [],
    loading: query.isLoading,
    refetch: query.refetch,
  }
}

export function useContactLog() {
  const { organizationId } = useOrganization()

  return useQuery({
    queryKey: ['marketing', 'contact-log', organizationId],
    queryFn: async (): Promise<ContactLogEntry[]> => {
      if (!organizationId) return []
      const { data, error } = await supabase
        .from('marketing_contacts_log')
        .select(
          'id, client_id, channel, template_title, message_preview, contacted_at, client:wedding_clients(full_name)',
        )
        .eq('user_id', organizationId)
        .order('contacted_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return (data ?? []).map((row) => {
        const client = Array.isArray(row.client) ? row.client[0] : row.client
        return {
          id: row.id,
          client_id: row.client_id,
          client_name: client?.full_name ?? '—',
          channel: row.channel,
          template_title: row.template_title,
          message_preview: row.message_preview,
          contacted_at: row.contacted_at,
        }
      })
    },
    enabled: !!organizationId,
    staleTime: 30_000,
  })
}

export function useLogContact() {
  const { organizationId } = useOrganization()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      client_id: string
      template_id?: string
      template_title?: string
      message_preview?: string
      channel?: string
    }) => {
      if (!organizationId) throw new Error('No organization context')
      const { error } = await supabase.from('marketing_contacts_log').insert({
        user_id: organizationId,
        client_id: input.client_id,
        template_id: input.template_id ?? null,
        template_title: input.template_title ?? null,
        message_preview: input.message_preview ?? null,
        channel: input.channel ?? 'whatsapp',
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'inactive-clients', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['marketing', 'contact-log', organizationId] })
    },
    onError: (err) => logger.error(err, 'useLogContact'),
  })
}
