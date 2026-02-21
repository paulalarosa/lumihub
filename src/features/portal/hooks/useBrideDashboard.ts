import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { differenceInDays } from 'date-fns'
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

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [project, setProject] = useState<BrideProject | null>(null)
  const [totalContract, setTotalContract] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [services, setServices] = useState<ServiceItem[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [events, _setEvents] = useState<Event[]>([])
  const [daysLeft, setDaysLeft] = useState(0)
  const [bride, _setBride] = useState<BrideData | null>(null)
  const [isSigOpen, setIsSigOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  )

  const storedAuth = localStorage.getItem(`bride_auth_${clientId}`)
  const storedPin = storedAuth ? JSON.parse(storedAuth).pin : null

  useEffect(() => {
    if (clientId) fetchData(storedPin || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  const fetchData = async (_pin: string) => {
    setLoading(true)
    setError(null)

    try {
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
        setError('Projeto não encontrado para este cliente.')
        setLoading(false)
        return
      }

      const typedProject = projectData as unknown as BrideProject
      setProject(typedProject)

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

      setTotalContract(totalValue)
      setPaidAmount(paidValue)

      setServices(
        sData.map((s) => {
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
        }),
      )

      const targetDate =
        typedProject.event_date || typedProject.client?.wedding_date
      if (targetDate) {
        const diff = differenceInDays(new Date(targetDate), new Date())
        setDaysLeft(diff > 0 ? diff : 0)
      }

      const { data: contractsData } = await supabase
        .from('contracts')
        .select('*')
        .eq('project_id', typedProject.id)
      setContracts(contractsData || [])
    } catch (_e) {
      setError('Não foi possível carregar os dados.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(`bride_auth_${clientId}`)
    localStorage.removeItem(`bride_pin_${clientId}`)
    navigate(`/portal/${clientId}/login`)
  }

  const refreshData = () => {
    if (storedPin) fetchData(storedPin)
  }

  return {
    clientId,
    loading,
    error,
    project,
    totalContract,
    paidAmount,
    services,
    contracts,
    events,
    daysLeft,
    bride,
    isSigOpen,
    setIsSigOpen,
    selectedContract,
    setSelectedContract,
    handleLogout,
    refreshData,
  }
}
