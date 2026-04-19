import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { logger } from '@/services/logger'
import { Button } from '@/components/ui/button'
import { CreditCard, Users, TrendingUp, Download, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { exportMonthlyClosing } from '@/services/reportService'
import { format } from 'date-fns/format'
import { startOfMonth } from 'date-fns/startOfMonth'
import { endOfMonth } from 'date-fns/endOfMonth'
import { ptBR } from 'date-fns/locale'
import {
  CommissionTable,
  AssistantCommission,
} from './components/CommissionTable'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/integrations/supabase/types'

type EventWithAssistants = Database['public']['Tables']['events']['Row'] & {
  wedding_clients: { name: string | null } | null
  event_assistants: {
    assistant_id: string
    assistant: { name: string | null } | null
  }[]
}

interface FinancialStats {
  mrr: number
  activeSubscribers: number
  churnRate: string
  growth: string
}

interface AdminFinancialsProps {
  stats: FinancialStats
  loading: boolean
}

export default function AdminFinancials({
  stats,
  loading,
}: AdminFinancialsProps) {
  const { toast } = useToast()
  const [events, setEvents] = useState<EventWithAssistants[]>([])
  const [commissions, setCommissions] = useState<AssistantCommission[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const calculateCommissions = useCallback((eventsData: EventWithAssistants[]) => {
    const commissionMap = new Map<string, AssistantCommission>()

    eventsData.forEach((event) => {
      const totalCommission = Number(event.assistant_commission) || 0
      const assistants = event.event_assistants || []

      if (assistants.length > 0 && totalCommission > 0) {
        const splitCommission = totalCommission / assistants.length

        assistants.forEach((ea) => {
          const assistantName = ea.assistant?.name || 'Desconhecido'
          const assistantId = ea.assistant_id

          if (!commissionMap.has(assistantId)) {
            commissionMap.set(assistantId, {
              assistant_id: assistantId,
              assistant_name: assistantName,
              total_events: 0,
              total_commission: 0,
            })
          }

          const current = commissionMap.get(assistantId)!
          current.total_events += 1
          current.total_commission += splitCommission
        })
      }
    })

    setCommissions(Array.from(commissionMap.values()))
  }, [])

  useEffect(() => {
    const fetchMonthlyData = async () => {
      const now = new Date()
      const start = startOfMonth(now).toISOString()
      const end = endOfMonth(now).toISOString()

      try {
        const { data: eventsData, error } = await supabase
          .from('events')
          .select(
            `
                        *,
                        wedding_clients (name),
                        event_assistants (
                            assistant_id,
                            assistant:profiles!assistants (name)
                        )
                    `,
          )
          .gte('event_date', start)
          .lte('event_date', end)

        if (error) throw error

        setEvents(eventsData || [])
        calculateCommissions((eventsData as EventWithAssistants[]) || [])
      } catch (error) {
        logger.error('AdminFinancials.fetchMonthlyData', error, 'SYSTEM', {
          showToast: false,
        })
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar o fechamento financeiro.',
          variant: 'destructive',
        })
      } finally {
        setDataLoading(false)
      }
    }

    fetchMonthlyData()
  }, [toast, calculateCommissions])

  const handleExport = () => {
    if (!events || events.length === 0) {
      toast({
        title: 'Sem dados',
        description: 'Não há dados para exportar neste mês.',
        variant: 'destructive',
      })
      return
    }
    exportMonthlyClosing(events)
    toast({
      title: 'Exportação Iniciada',
      description: 'O arquivo Excel está sendo gerado.',
    })
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-[#1A1A1A] border-white/10">
            <CardContent className="pt-6 h-32 animate-pulse bg-white/5" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black border border-white/10 rounded-none hover:border-white/30 transition-all group">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest font-bold">MRR (Receita Mensal)</p>
                <h3 className="text-3xl font-serif text-white mt-2 tracking-tighter">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(stats.mrr)}
                </h3>
              </div>
              <div className="p-2 bg-white/5 border border-white/10 group-hover:border-white/30 transition-colors">
                <CreditCard className="w-5 h-5 text-white/50" />
              </div>
            </div>
            <div className="mt-4 h-1 bg-zinc-900 overflow-hidden">
                <div className="h-full bg-white/40 w-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border border-white/10 rounded-none hover:border-white/30 transition-all group">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest font-bold">Assinantes Ativos</p>
                <h3 className="text-3xl font-serif text-white mt-2 tracking-tighter">
                  {stats.activeSubscribers}
                </h3>
              </div>
              <div className="p-2 bg-white/5 border border-white/10 group-hover:border-white/30 transition-colors">
                <Users className="w-5 h-5 text-white/50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border border-white/10 rounded-none hover:border-white/30 transition-all group">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest font-bold">Receita Total</p>
                <h3 className="text-3xl font-serif text-white mt-2 tracking-tighter">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(stats.mrr * 12)}
                </h3>
              </div>
              <div className="p-2 bg-white/5 border border-white/10 group-hover:border-white/30 transition-colors">
                <TrendingUp className="w-5 h-5 text-white/50" />
              </div>
            </div>
            <p className="text-[10px] text-zinc-600 font-mono mt-3 uppercase tracking-wider">Projeção anual (MRR × 12)</p>
          </CardContent>
        </Card>
      </div>

      {}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-serif text-white tracking-tight">
              Gestão Financeira e Comissões
            </h2>
            <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] mt-1">
              Terminal: {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={dataLoading}
            className="rounded-none bg-white text-black hover:bg-zinc-200 font-mono text-[11px] uppercase tracking-widest font-bold h-11 px-8"
          >
            {dataLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            EXPORT_CLOSING_REPORT
          </Button>
        </div>

        <CommissionTable data={commissions} />
      </div>
    </div>
  )
}
