import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { differenceInDays } from 'date-fns/differenceInDays'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  Project,
  ProjectService,
  Service,
  Transaction,
  Contract,
} from '@/types/api.types'

interface ServiceItem {
  id: string
  name: string
  price: number
  status: 'pending' | 'paid' | 'partial'
  paid_amount: number
}

interface BrideData {
  id: string
  name: string
  wedding_date: string | null
}

interface Event {
  id: string
  title: string
  event_date: string
  event_type: string | null
}

interface BrideProject extends Project {
  client: {
    full_name: string | null
    email: string | null
    phone: string | null
    wedding_date: string | null
  } | null
  services: (ProjectService & {
    service: Pick<Service, 'name'> | null
  })[]
  transactions: Transaction[]
}

export type { ServiceItem, BrideData, Event as BrideEvent, BrideProject }

export function useBrideDashboard() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isSigOpen, setIsSigOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  )

  const storedAuth = localStorage.getItem(`bride_auth_${clientId}`)
  const storedPin = storedAuth ? JSON.parse(storedAuth).pin : null

  const {
    data: dashboardData,
    isLoading: loading,
    error: queryError,
    refetch: refreshData,
  } = useQuery({
    queryKey: ['bride-dashboard', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID is required')

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(
          `
          *,
          client:wedding_clients(full_name, email, phone, wedding_date),
          services:project_services(*, service:services(name)),
          transactions(*)
        `,
        )
        .eq('client_id', clientId)
        .maybeSingle()

      if (projectError) throw projectError
      if (!projectData) {
        throw new Error('Projeto não encontrado para este cliente.')
      }

      const typedProject = projectData as unknown as BrideProject
      const sData = typedProject.services || []
      const tData = typedProject.transactions || []

      const totalValue = sData.reduce((sum: number, s) => {
        const price =
          typeof s.unit_price === 'string'
            ? parseFloat(s.unit_price)
            : Number(s.unit_price || 0)
        const quantity =
          typeof s.quantity === 'string'
            ? parseFloat(s.quantity)
            : Number(s.quantity || 1)
        return sum + price * quantity
      }, 0)

      const paidValue = tData
        .filter((t) => t.type === 'income')
        .reduce((sum: number, t) => sum + (Number(t.amount) || 0), 0)

      const targetDate =
        typedProject.event_date || typedProject.client?.wedding_date
      let daysLeft = 0
      if (targetDate) {
        const diff = differenceInDays(new Date(targetDate), new Date())
        daysLeft = diff > 0 ? diff : 0
      }

      const { data: contractsData } = await supabase
        .from('contracts')
        .select('*')
        .eq('project_id', typedProject.id)

      return {
        project: typedProject,
        totalContract: totalValue,
        paidAmount: paidValue,
        services: sData.map((s) => {
          const uPrice =
            typeof s.unit_price === 'string'
              ? parseFloat(s.unit_price)
              : Number(s.unit_price || 0)
          return {
            id: s.id,
            name: s.service?.name || 'Serviço',
            price: uPrice,
            status: 'pending' as const,
            paid_amount: 0,
          }
        }) as ServiceItem[],
        contracts: (contractsData || []) as Contract[],
        daysLeft,
        events: [] as Event[], // Placeholder for now or fetch if needed
        bride: {
          id: typedProject.client_id,
          name: typedProject.client?.full_name || 'Noiva',
          wedding_date: typedProject.client?.wedding_date || null,
        } as BrideData,
      }
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const handleLogout = () => {
    localStorage.removeItem(`bride_auth_${clientId}`)
    localStorage.removeItem(`bride_pin_${clientId}`)
    navigate(`/portal/${clientId}/login`)
  }

  return {
    clientId,
    loading,
    error: queryError ? (queryError as Error).message : null,
    project: dashboardData?.project || null,
    totalContract: dashboardData?.totalContract || 0,
    paidAmount: dashboardData?.paidAmount || 0,
    services: dashboardData?.services || [],
    contracts: dashboardData?.contracts || [],
    events: dashboardData?.events || [],
    daysLeft: dashboardData?.daysLeft || 0,
    bride: dashboardData?.bride || null,
    isSigOpen,
    setIsSigOpen,
    selectedContract,
    setSelectedContract,
    handleLogout,
    refreshData,
  }
}
