import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { differenceInDays } from 'date-fns/differenceInDays'
import { useQuery } from '@tanstack/react-query'

import type { Contract } from '@/types/api.types'

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

interface BrideEventRow {
  id: string
  title: string | null
  description: string | null
  event_type: string | null
  event_date: string
  start_time: string | null
  end_time: string | null
  arrival_time: string | null
  making_of_time: string | null
  ceremony_time: string | null
  location: string | null
  address: string | null
  color: string | null
}

interface BrideProject {
  id: string
  name: string | null
  status: string | null
  event_date: string | null
  event_time: string | null
  event_location: string | null
  notes: string | null
  total_value: number | null
  created_at: string
  client_id?: string
  client?: BrideData | null
}

interface BridePortalPayload {
  client: {
    id: string
    name: string | null
    full_name: string | null
    email: string | null
    phone: string | null
    wedding_date: string | null
    portal_link: string | null
  } | null
  project: BrideProject | null
  services: Array<{
    id: string
    name: string
    quantity: number | null
    unit_price: number | null
    line_total: number
  }>
  contracts: Contract[]
  events: BrideEventRow[]
  transactions: Array<{
    id: string
    amount: number
    date: string | null
    payment_method: string | null
    category: string | null
    description: string | null
  }>
  total_contract: number
  total_paid: number
  is_fully_paid: boolean
  makeup_artist: MakeupArtistContact | null
  error?: string
}

interface MakeupArtistContact {
  full_name: string | null
  phone: string | null
  whatsapp: string | null
}

export type {
  ServiceItem,
  BrideData,
  MakeupArtistContact,
  BrideEventRow as BrideEvent,
  BrideProject,
}

export function useBrideDashboard() {
  const { clientId } = useParams()
  const navigate = useNavigate()

  const [isSigOpen, setIsSigOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  )

  const {
    data: dashboardData,
    isLoading: loading,
    error: queryError,
    refetch: refreshData,
  } = useQuery({
    queryKey: ['bride-dashboard', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID is required')

      // Antes o hook fazia SELECTs diretos que falhavam silenciosamente por
      // RLS (a noiva é anon, não tem auth.uid()). Agora usa a RPC
      // SECURITY DEFINER `get_bride_portal` que valida o token guardado
      // em sessionStorage e retorna shape completo em uma viagem só.
      const token = sessionStorage.getItem('bride_access_token')
      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      const { data, error } = await supabase.rpc('get_bride_portal', {
        p_token: token,
      })

      if (error) throw error

      const payload = data as unknown as BridePortalPayload

      if (!payload || payload.error) {
        throw new Error(payload?.error || 'Sessão inválida.')
      }

      const typedProject = payload.project

      // is_fully_paid vem pronto do server. Pros services individuais:
      // sem rastreio per-item explícito no schema atual, adotamos regra
      // simples — todos viram "paid" quando o total cobre o contrato;
      // "pending" caso contrário. Não mente em contextos ambíguos.
      const serviceStatus: 'paid' | 'pending' = payload.is_fully_paid
        ? 'paid'
        : 'pending'

      const services: ServiceItem[] = payload.services.map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.line_total ?? 0),
        status: serviceStatus,
        paid_amount: serviceStatus === 'paid' ? Number(s.line_total ?? 0) : 0,
      }))

      const targetDate =
        typedProject?.event_date || payload.client?.wedding_date || null
      let daysLeft = 0
      if (targetDate) {
        const diff = differenceInDays(new Date(targetDate), new Date())
        daysLeft = diff > 0 ? diff : 0
      }

      return {
        project: typedProject,
        totalContract: Number(payload.total_contract ?? 0),
        paidAmount: Number(payload.total_paid ?? 0),
        services,
        contracts: payload.contracts,
        daysLeft,
        events: payload.events,
        isFullyPaid: payload.is_fully_paid,
        makeupArtist: payload.makeup_artist,
        bride: {
          id: payload.client?.id ?? clientId,
          name:
            payload.client?.full_name ||
            payload.client?.name ||
            'Noiva',
          wedding_date: payload.client?.wedding_date ?? null,
        } as BrideData,
      }
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  })

  const handleLogout = () => {
    sessionStorage.removeItem('bride_access_token')
    sessionStorage.removeItem('bride_client_id')
    // Limpa chaves antigas caso sobrevivam de versões anteriores.
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
    makeupArtist: dashboardData?.makeupArtist || null,
    isFullyPaid: dashboardData?.isFullyPaid ?? false,
    isSigOpen,
    setIsSigOpen,
    selectedContract,
    setSelectedContract,
    handleLogout,
    refreshData,
  }
}
