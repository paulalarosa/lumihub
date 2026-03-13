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
  // status: 'paid' | 'pending'; // In future we can track this in DB
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
    // Here we would call an API Update in the future
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
              className="border-white/10 hover:bg-white/5"
            >
              <TableCell className="font-medium text-white">
                {item.assistant_name}
              </TableCell>
              <TableCell className="text-gray-300 text-center">
                <Badge
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 text-white"
                >
                  {item.total_events}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-[#00e5ff] font-bold">
                {formatCurrency(item.total_commission)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  onClick={() => handleMarkAsPaid(item.assistant_name)}
                  className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar Pago
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
