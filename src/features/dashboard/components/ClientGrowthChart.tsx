import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyGrowth } from '@/hooks/useClientStats'

interface ClientGrowthChartProps {
  data: MonthlyGrowth[]
  loading?: boolean
}

export function ClientGrowthChart({
  data,
  loading = false,
}: ClientGrowthChartProps) {
  if (loading) {
    return (
      <Card className="bg-neutral-900 border-neutral-700 rounded-none">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-40 bg-neutral-800" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full bg-neutral-800" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="bg-neutral-900 border-neutral-700 rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            Evolução de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <span className="text-neutral-600 font-mono text-xs uppercase">
            Sem dados disponíveis
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700 rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          Evolução de Clientes (6 meses)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          role="img"
          aria-label={`Gráfico de linha: evolução de clientes ao longo dos últimos 6 meses. ${data.length} pontos de dados.`}
        >
          <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#333"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#333' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: 0,
                fontFamily: 'monospace',
                fontSize: 11,
              }}
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#22c55e' }}
            />
            <Line
              type="monotone"
              dataKey="count"
              name="Clientes"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', strokeWidth: 0, r: 4 }}
              activeDot={{
                r: 6,
                fill: '#fff',
                stroke: '#22c55e',
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default ClientGrowthChart
