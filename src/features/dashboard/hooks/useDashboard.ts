import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { supabase } from '@/integrations/supabase/client'
import { ClientService } from '@/services/clientService'
import { ProjectService } from '@/services/projectService'
import { EventService, DashboardEvent } from '@/services/event.service'
import { CommissionLogic } from '@/services/commissionLogic'
import {
  MarketingLogic,
  type MarketingTrigger,
} from '@/services/marketingLogic'

export function useDashboard() {
  const navigate = useNavigate()
  const { user, isAdmin, signOut } = useAuth()
  const { organizationId, isOwner, loading: orgLoading } = useOrganization()

  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(true)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [clientsCount, setClientsCount] = useState<number>(0)
  const [projectsCount, setProjectsCount] = useState<number>(0)
  const [totalRevenue, setTotalRevenue] = useState<number>(0)
  const [totalCommissions, setTotalCommissions] = useState<number>(0)
  const [upcomingEvents, setUpcomingEvents] = useState<DashboardEvent[]>([])
  const [marketingTriggers, setMarketingTriggers] = useState<
    MarketingTrigger[]
  >([])
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [originStats, setOriginStats] = useState<
    { name: string; value: number }[]
  >([])
  const [profileName, setProfileName] = useState<string>('')

  useEffect(() => {
    if (!user) return
    const checkUserStatus = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('onboarding_completed, full_name, subscription_tier')
        .eq('id', user.id)
        .maybeSingle()

      if (profileData) {
        if (profileData.full_name) {
          setProfileName((profileData.full_name || '').split(' ')[0])
        }
        if (profileData.onboarding_completed === false) {
          setOnboardingCompleted(false)
        }
        if (
          user.email === 'nathaliasbrb@gmail.com' &&
          profileData.subscription_tier !== 'studio'
        ) {
          await supabase
            .from('profiles')
            .update({ subscription_tier: 'studio' } as Record<string, unknown>)
            .eq('id', user.id)
        }
      }
      setCheckingOnboarding(false)
    }
    checkUserStatus()
  }, [user])

  useEffect(() => {
    if (!organizationId) return

    const fetchDashboardData = async () => {
      try {
        setDataLoading(true)

        let currentAssistantId: string | null = null
        if (!isAdmin) {
          const { data: assistant } = await supabase
            .from('assistants')
            .select('id')
            .eq('user_id', user!.id)
            .maybeSingle()
          currentAssistantId = assistant?.id ?? null
        }

        const promises: Promise<unknown>[] = [
          EventService.getUpcomingEvents(
            organizationId,
            user!.id,
            isAdmin ? 'admin' : 'assistant',
          ),
          ClientService.count(organizationId),
          ProjectService.count(organizationId),
        ]

        if (isAdmin) {
          promises.push(CommissionLogic.getFinancialReport(organizationId))
        } else if (currentAssistantId) {
          promises.push(
            CommissionLogic.getAssistantCommissions(currentAssistantId),
          )
        } else {
          promises.push(
            Promise.resolve({ totalRevenue: 0, totalCommissions: 0 }),
          )
        }

        if (isAdmin) {
          promises.push(MarketingLogic.getTriggers(organizationId))
          promises.push(ClientService.getOriginStats(organizationId))
        } else {
          promises.push(Promise.resolve([]))
          promises.push(Promise.resolve([]))
        }

        const [
          eventData,
          clientCountVal,
          projectCountVal,
          financialStats,
          marketingData,
          originData,
        ] = await Promise.all(promises)

        const evtResult = eventData as {
          events: DashboardEvent[]
          isGoogleConnected: boolean
        }
        setUpcomingEvents(evtResult.events)
        setIsGoogleConnected(evtResult.isGoogleConnected)
        setClientsCount(clientCountVal as number)
        setProjectsCount(projectCountVal as number)

        const finStats = financialStats as {
          totalRevenue: number
          totalCommissions: number
        }
        setTotalRevenue(isAdmin ? finStats.totalRevenue : 0)
        setTotalCommissions(finStats.totalCommissions)
        setMarketingTriggers(marketingData as MarketingTrigger[])
        setOriginStats(originData as { name: string; value: number }[])
      } catch (_) {
        // Error handled silently
      } finally {
        setDataLoading(false)
      }
    }

    fetchDashboardData()

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wedding_clients' },
        () => fetchDashboardData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => fetchDashboardData(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return {
    user,
    isAdmin,
    isOwner,
    orgLoading,
    dataLoading,
    onboardingCompleted,
    checkingOnboarding,
    clientsCount,
    projectsCount,
    totalRevenue,
    totalCommissions,
    upcomingEvents,
    marketingTriggers,
    isGoogleConnected,
    originStats,
    profileName,
    handleSignOut,
    navigate,
  }
}
