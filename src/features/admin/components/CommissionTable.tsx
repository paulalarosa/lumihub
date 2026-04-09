import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/format'

export interface AssistantCommission {
  assistant_id: string
  assistant_name: string
  total_events: number
  total_commission: number
}

interface CommissionTableProps {
  data: AssistantCommission[]
}

export function CommissionTable({ data }: CommissionTableProps) {
  const { toast } = useToast()

  const handleMarkAsPaid = (assistantName: string) => {
    toast({
      title: 'Pagamento Registrado',
      description: `As comissões de ${assistantName} foram marcadas como pagas.`,
    })
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 border border-white/10 rounded-lg bg-[#1A1A1A]">
        <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-600" />
        <p>Nenhuma comissão registrada para este período.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-white/10 bg-[#1A1A1A]">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-white">Assistente</TableHead>
            <TableHead className="text-white text-center">
              Total de Eventos
            </TableHead>
            <TableHead className="text-white text-right">
              Comissão Acumulada
            </TableHead>
            <TableHead className="text-white text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.assistant_id}
              className="border-white/5 hover:bg-white/[0.02] transition-colors"
            >
              <TableCell className="font-serif text-white py-4 px-6">
                {item.assistant_name}
              </TableCell>
              <TableCell className="text-center py-4 px-6">
                <Badge
                  variant="outline"
                  className="rounded-none border-white/10 bg-white/5 text-zinc-400 font-mono text-[10px] tracking-widest px-3"
                >
                  {item.total_events} EVENTS
                </Badge>
              </TableCell>
              <TableCell className="text-right py-4 px-6 font-mono text-white font-bold tracking-tighter text-lg">
                {formatCurrency(item.total_commission)}
              </TableCell>
              <TableCell className="text-right py-4 px-6">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAsPaid(item.assistant_name)}
                  className="rounded-none border-white/10 bg-transparent text-white hover:bg-white hover:text-black font-mono text-[10px] uppercase tracking-widest transition-all h-9 px-4"
                >
                  <CheckCircle className="w-3 h-3 mr-2" />
                  PAYOUT_MARK
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
