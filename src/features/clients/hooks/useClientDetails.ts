import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/services/logger'
import { generateClientPDF } from '@/services/reportService'
import { useToast } from '@/hooks/use-toast'
import {
  ClientService,
  Client,
  TreatmentRecord,
} from '@/features/clients/api/clientService'
import { ReportProject } from '@/types/service-types'

export interface EventWithServices {
  id: string
  event_date: string
  title?: string
  location?: string
  status?: string
  total_value?: number
  project_services?: Array<{
    id: string
    quantity: number
    unit_price: number
    total_price: number
    services: { name: string }
  }>
}

import { Database } from '@/integrations/supabase/types'

// Local interface for the missing table
interface TreatmentRecordTable {
  Row: {
    id: string
    client_id: string
    service_name: string
    date: string
    description: string | null
    created_at: string
  }
  Insert: {
    id?: string
    client_id: string
    service_name: string
    date: string
    description?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    client_id?: string
    service_name?: string
    date?: string
    description?: string | null
    created_at?: string
  }
  Relationships: []
}

type LocalDatabase = Database & {
  public: {
    Tables: {
      treatment_records: TreatmentRecordTable
    }
  }
}

export function useClientDetails(id: string | undefined) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [client, setClient] = useState<Client | null>(null)
  const [records, setRecords] = useState<TreatmentRecord[]>([])
  const [events, setEvents] = useState<EventWithServices[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (id) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchData = async () => {
    if (!id) return
    setLoadingData(true)

    try {
      // Fetch client
      const { data: clientData, error: clientError } =
        await ClientService.get(id)

      if (clientError || !clientData) {
        toast({ title: 'Cliente não encontrado', variant: 'destructive' })
        navigate('/clientes')
        return
      }

      setClient(clientData as Client)

      // Fetch records
      const { data: recordsData } = await ClientService.getTreatmentRecords(id)
      setRecords(recordsData || [])

      // Fetch events for PDF
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(
          `
                    id,
                    event_date,
                    title,
                    location,
                    status,
                    total_value,
                    project_services (
                        id,
                        quantity,
                        unit_price,
                        total_price,
                        services (name)
                    )
                `,
        )
        .eq('client_id', id)
        .order('event_date', { ascending: false })

      if (eventsError) throw eventsError

      if (eventsData) {
        // Supabase types for joined queries can be tricky, safe cast here
        setEvents(eventsData)
      }
    } catch (error) {
      logger.error(error, 'useClientDetails.fetchData', { showToast: false })
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as informações do cliente.',
        variant: 'destructive',
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleExportPDF = () => {
    if (!client) return

    const reportProjects: ReportProject[] = events.map((e) => ({
      title: e.title || 'Evento sem título',
      event_date: e.event_date,
      location: e.location || null,
      status: e.status || 'N/A',
      total_value: e.total_value,
      project_services: e.project_services?.map((ps) => ({
        name: ps.services.name,
        quantity: ps.quantity,
        unit_price: ps.unit_price,
        total_price: ps.total_price,
        services: ps.services,
      })),
    }))

    generateClientPDF(client, reportProjects)
    toast({
      title: 'Relatório gerado',
      description: 'O PDF do histórico foi baixado com sucesso.',
    })
  }

  const deleteRecord = async (recordId: string) => {
    try {
      const typedSupabase = supabase
      const { error } = await typedSupabase
        .from('treatment_records')
        .delete()
        .eq('id', recordId)

      if (error) throw error

      toast({
        title: 'Registro excluído',
        description: 'O registro foi removido com sucesso.',
      })
      fetchData()
    } catch (error) {
      logger.error(error, 'useClientDetails.deleteRecord', { showToast: false })
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o registro.',
        variant: 'destructive',
      })
    }
  }

  return {
    client,
    records,
    loadingData,
    events,
    fetchData,
    handleExportPDF,
    deleteRecord,
  }
}
