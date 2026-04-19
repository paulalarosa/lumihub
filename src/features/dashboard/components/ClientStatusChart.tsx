import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

interface StatusData {
  name: string
  value: number
  color: string
}

interface ClientStatusChartProps {
  active: number
  inactive: number
  loading?: boolean
}

export function ClientStatusChart({
  active,
  inactive,
  loading = false,
}: ClientStatusChartProps) {
  const data: StatusData[] = [
    { name: 'Ativos', value: active, color: '#22c55e' },
    { name: 'Inativos', value: inactive, color: '#6b7280' },
  ].filter((item) => item.value > 0)

  const total = active + inactive

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

  if (total === 0) {
    return (
      <Card className="bg-neutral-900 border-neutral-700 rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            Status de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <span className="text-neutral-600 font-mono text-xs uppercase">
            Nenhum cliente cadastrado
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700 rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          Status de Clientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          role="img"
          aria-label={`Gráfico de pizza: status de clientes. Total de ${total} clientes distribuídos em ${data.length} categorias.`}
        >
          <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: 0,
                fontFamily: 'monospace',
                fontSize: 11,
              }}
              formatter={(value: number, name: string) => [
                `${value} (${Math.round((value / total) * 100)}%)`,
                name,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span
                  style={{
                    color: '#999',
                    fontFamily: 'monospace',
                    fontSize: 10,
                  }}
                >
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default ClientStatusChart
