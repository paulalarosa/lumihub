import { useState, useEffect, useCallback } from 'react'
import { MarketingService, MarketingCampaign } from '@/services/marketing'
import { supabase } from '@/integrations/supabase/client'
import { differenceInDays } from 'date-fns'
import { logger } from '@/utils/logger'

export interface InactiveClient {
  id: string
  name: string
  phone: string | null
  created_at: string
  last_visit?: string | null
  days_since_created: number
}

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

export const useInactiveClients = () => {
  const [clients, setClients] = useState<InactiveClient[]>([])
  const [loading, setLoading] = useState(false)

  const fetchInactiveClients = useCallback(async () => {
    setLoading(true)
    try {
      // Enhanced query to check for active projects
      const { data, error: clientError } = await supabase
        .from('wedding_clients')
        .select('id, name:full_name, phone, created_at, projects(status)')

      if (clientError) throw clientError

      // Cast to bypass complex join typing
      const allClients = data as unknown as {
        id: string
        name: string
        phone: string | null
        created_at: string
        projects: { status: string }[]
      }[]

      const now = new Date()
      const processedClients: InactiveClient[] = []

      for (const client of allClients || []) {
        const createdDate = new Date(client.created_at)
        const daysDiff = differenceInDays(now, createdDate)

        // Check for ANY active project
        const hasActiveProject = client.projects?.some(
          (p) => p.status === 'active' || p.status === 'ongoing',
        )

        // Logic: Created > 45 days AND NO active project
        if (daysDiff > 45 && !hasActiveProject) {
          processedClients.push({
            id: client.id,
            name: client.name, // mapped from full_name
            phone: client.phone,
            created_at: client.created_at,
            days_since_created: daysDiff,
          })
        }
      }

      setClients(
        processedClients.sort(
          (a, b) => b.days_since_created - a.days_since_created,
        ),
      )
    } catch (error) {
      logger.error(error, {
        message: 'Erro ao carregar lista de marketing.',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    clients,
    loading,
    fetchInactiveClients,
  }
}
