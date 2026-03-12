import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { CompanyBreakdown } from '@/hooks/useClientStats'

interface ClientsByCompanyChartProps {
  data: CompanyBreakdown[]
  loading?: boolean
}

const COLORS = ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d']

export function ClientsByCompanyChart({
  data,
  loading = false,
}: ClientsByCompanyChartProps) {
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
            Top 5 Empresas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <span className="text-neutral-600 font-mono text-xs uppercase">
            Sem dados de empresas
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700 rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          Top 5 Empresas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#333' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="company"
              tick={{ fill: '#999', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              width={100}
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
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar dataKey="count" name="Clientes" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default ClientsByCompanyChart
