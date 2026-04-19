import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface RevenueChartProps {
  className?: string
  overrideMetrics?: {
    activeContracts: number
    leads: number
    subtitle?: string
  }
}

export const RevenueChart = ({
  className,
  overrideMetrics,
}: RevenueChartProps) => {
  const { data: metrics } = useDashboardMetrics()

  const activeContracts = overrideMetrics
    ? overrideMetrics.activeContracts
    : metrics?.activeContracts || 0
  const leads = overrideMetrics ? overrideMetrics.leads : metrics?.leads || 0

  const TICKET = overrideMetrics ? 89.9 : 1500

  const guaranteed = activeContracts * TICKET
  const potential = leads * TICKET

  const data = [
    {
      name: 'Jan',
      [overrideMetrics ? 'RECURRING (MRR)' : 'GUARANTEED (ACTIVE)']: guaranteed,
      [overrideMetrics ? 'PROJECTED' : 'POTENTIAL (LEADS)']: potential,
    },
    {
      name: 'Feb',
      [overrideMetrics ? 'RECURRING (MRR)' : 'GUARANTEED (ACTIVE)']:
        guaranteed * 1.05,
      [overrideMetrics ? 'PROJECTED' : 'POTENTIAL (LEADS)']: potential * 0.9,
    },
    {
      name: 'Mar',
      [overrideMetrics ? 'RECURRING (MRR)' : 'GUARANTEED (ACTIVE)']:
        guaranteed * 1.1,
      [overrideMetrics ? 'PROJECTED' : 'POTENTIAL (LEADS)']: potential * 1.2,
    },
  ]

  const formatCurrency = (value: number) =>
    'R$ ' +
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    })

  const formatYAxis = (value: number) => {
    if (value >= 1000) return 'k' + value / 1000
    return value.toString()
  }

  return (
    <div
      className={className}
      style={{ width: '100%', height: '100%' }}
      role="img"
      aria-label="Gráfico de barras: projeção de receita mensal comparando valor garantido versus potencial de leads."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontFamily: 'Inter', fill: '#666' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={formatYAxis}
            tick={{ fontFamily: 'Inter', fill: '#666' }}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'black',
              borderRadius: '4px',
              border: 'none',
              color: 'white',
            }}
            itemStyle={{ color: 'white' }}
          />
          <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: '12px' }} />
          <Bar
            dataKey={
              overrideMetrics ? 'RECURRING (MRR)' : 'GUARANTEED (ACTIVE)'
            }
            fill="#050505"
            barSize={20}
          />
          <Bar
            dataKey={overrideMetrics ? 'PROJECTED' : 'POTENTIAL (LEADS)'}
            fill="#fbbf24"
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
