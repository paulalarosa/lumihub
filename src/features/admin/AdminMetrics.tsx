import { lazy, Suspense, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  UserCheck,
  Activity,
  Loader2,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportCsv } from '@/lib/csvExport'
import { useGrowthMetrics, type GrowthMetrics } from './hooks/useGrowthMetrics'
import { useTopUsers, type TopUser } from './hooks/useTopUsers'
import { UserDetailsSheet } from './components/UserDetailsSheet'
import { FinancialReportExporter } from './components/FinancialReportExporter'

const AreaChart = lazy(() => import('recharts').then((m) => ({ default: m.AreaChart })))
const Area = lazy(() => import('recharts').then((m) => ({ default: m.Area })))
const BarChart = lazy(() => import('recharts').then((m) => ({ default: m.BarChart })))
const Bar = lazy(() => import('recharts').then((m) => ({ default: m.Bar })))
const PieChart = lazy(() => import('recharts').then((m) => ({ default: m.PieChart })))
const Pie = lazy(() => import('recharts').then((m) => ({ default: m.Pie })))
const Cell = lazy(() => import('recharts').then((m) => ({ default: m.Cell })))
const XAxis = lazy(() => import('recharts').then((m) => ({ default: m.XAxis })))
const YAxis = lazy(() => import('recharts').then((m) => ({ default: m.YAxis })))
const Tooltip = lazy(() => import('recharts').then((m) => ({ default: m.Tooltip })))
const ResponsiveContainer = lazy(() =>
  import('recharts').then((m) => ({ default: m.ResponsiveContainer })),
)
const CartesianGrid = lazy(() =>
  import('recharts').then((m) => ({ default: m.CartesianGrid })),
)

const currency = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(n)

export default function AdminMetrics() {
  const { data, isLoading } = useGrowthMetrics()
  const { data: topUsers = [], isLoading: loadingUsers } = useTopUsers(15)
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null)

  if (isLoading || !data) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <header className="border-b border-white/5 pb-6">
        <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
          Métricas
        </span>
        <h1 className="font-serif text-3xl text-white mt-1">
          Crescimento e Receita
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Últimos 6 meses · Atualizado em tempo real
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-px bg-white/5">
        <KpiTile
          icon={Users}
          label="Total de cadastros"
          value={data.totalSignups.toString()}
        />
        <KpiTile
          icon={UserCheck}
          label="Pagantes ativas"
          value={data.totalPaying.toString()}
        />
        <KpiTile
          icon={DollarSign}
          label="MRR atual"
          value={currency(data.plans.reduce((acc, p) => acc + p.mrr, 0))}
          accent
        />
        <KpiTile
          icon={data.churnRate30d > 5 ? TrendingDown : TrendingUp}
          label="Churn 30d"
          value={`${data.churnRate30d}%`}
          critical={data.churnRate30d > 5}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Novos cadastros (6 meses)" icon={Activity}>
          <Suspense fallback={<ChartLoader />}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis
                  dataKey="label"
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
                    backgroundColor: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 0,
                    fontFamily: 'monospace',
                    fontSize: 11,
                  }}
                  labelStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="signups" name="Cadastros" fill="#fff" />
              </BarChart>
            </ResponsiveContainer>
          </Suspense>
        </Panel>

        <Panel title="Receita mensal recorrente" icon={DollarSign}>
          <Suspense fallback={<ChartLoader />}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#333' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 0,
                    fontFamily: 'monospace',
                    fontSize: 11,
                  }}
                  formatter={(value: number) => currency(value)}
                  labelStyle={{ color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="MRR"
                  stroke="#fff"
                  strokeWidth={2}
                  fill="url(#mrrGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Suspense>
        </Panel>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Distribuição por plano" icon={Users}>
          {data.plans.length === 0 ? (
            <EmptyState message="Nenhuma assinatura paga ainda" />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Suspense fallback={<ChartLoader />}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.plans}
                      dataKey="count"
                      nameKey="plan"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {data.plans.map((p) => (
                        <Cell key={p.plan} fill={p.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a0a0a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 0,
                        fontFamily: 'monospace',
                        fontSize: 11,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Suspense>
              <PlanLegend plans={data.plans} />
            </div>
          )}
        </Panel>

        <Panel title="Funil de conversão" icon={TrendingUp}>
          <FunnelView funnel={data.funnel} />
        </Panel>
      </section>

      <FinancialReportExporter />

      <section>
        <Panel
          title="Top usuárias por receita gerada"
          icon={TrendingUp}
          action={
            topUsers.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportTopUsers(topUsers)}
                className="rounded-none h-7 text-[10px] uppercase tracking-widest"
              >
                <Download className="w-3 h-3 mr-1.5" /> CSV
              </Button>
            ) : null
          }
        >
          {loadingUsers ? (
            <ChartLoader />
          ) : topUsers.length === 0 ? (
            <EmptyState message="Nenhuma usuária ativa ainda" />
          ) : (
            <TopUsersTable users={topUsers} onSelect={setDetailsUserId} />
          )}
        </Panel>
      </section>

      <UserDetailsSheet
        userId={detailsUserId}
        onClose={() => setDetailsUserId(null)}
      />
    </div>
  )
}

function exportTopUsers(users: TopUser[]) {
  exportCsv(
    `top-users-${new Date().toISOString().split('T')[0]}`,
    users,
    [
      { key: 'name', header: 'Nome', value: (u) => u.full_name ?? '' },
      { key: 'email', header: 'Email', value: (u) => u.email ?? '' },
      { key: 'plan', header: 'Plano', value: (u) => u.plan_type ?? '' },
      { key: 'status', header: 'Status', value: (u) => u.plan_status ?? '' },
      { key: 'mrr', header: 'MRR (R$)', value: (u) => u.monthly_price ?? 0 },
      { key: 'clients', header: 'Clientes', value: (u) => u.clients_count },
      { key: 'projects', header: 'Projetos', value: (u) => u.projects_count },
      { key: 'events', header: 'Eventos', value: (u) => u.events_count },
      {
        key: 'revenue',
        header: 'Receita gerada (R$)',
        value: (u) => u.revenue_generated.toFixed(2),
      },
    ],
  )
}

function TopUsersTable({
  users,
  onSelect,
}: {
  users: TopUser[]
  onSelect: (userId: string) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 font-mono text-[10px] text-white/40 uppercase tracking-widest">
            <th className="text-left px-4 py-3">Usuária</th>
            <th className="text-left px-4 py-3">Plano</th>
            <th className="text-right px-4 py-3">Clientes</th>
            <th className="text-right px-4 py-3">Projetos</th>
            <th className="text-right px-4 py-3">Receita gerada</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr
              key={u.user_id}
              onClick={() => onSelect(u.user_id)}
              className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-white/30 tracking-widest">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate">
                      {u.full_name ?? 'Sem nome'}
                    </p>
                    <p className="text-white/30 text-xs truncate">
                      {u.email ?? '—'}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-[9px] uppercase tracking-widest border border-white/15 px-2 py-0.5 text-white/70">
                  {u.plan_type ?? 'free'}
                </span>
                {u.plan_status === 'trialing' && (
                  <span className="font-mono text-[9px] uppercase tracking-widest text-yellow-400 ml-2">
                    trial
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-mono text-white/80">
                {u.clients_count}
              </td>
              <td className="px-4 py-3 text-right font-mono text-white/80">
                {u.projects_count}
              </td>
              <td className="px-4 py-3 text-right font-mono text-white">
                {currency(u.revenue_generated)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function KpiTile({
  icon: Icon,
  label,
  value,
  accent,
  critical,
}: {
  icon: typeof Users
  label: string
  value: string
  accent?: boolean
  critical?: boolean
}) {
  return (
    <div className="bg-black p-6 space-y-3">
      <div className="flex items-center gap-2">
        <Icon
          className={`w-4 h-4 ${critical ? 'text-red-500' : accent ? 'text-yellow-400' : 'text-white/40'}`}
        />
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          {label}
        </span>
      </div>
      <p
        className={`font-serif text-3xl leading-none ${critical ? 'text-red-400' : accent ? 'text-white' : 'text-white'}`}
      >
        {value}
      </p>
    </div>
  )
}

function Panel({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string
  icon: typeof Users
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="border border-white/10 bg-white/[0.02]">
      <header className="flex items-center justify-between gap-2 px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-white/40" />
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/60">
            {title}
          </h3>
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </div>
  )
}

function ChartLoader() {
  return (
    <div className="h-[240px] flex items-center justify-center">
      <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center">
      <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
        {message}
      </p>
    </div>
  )
}

function PlanLegend({ plans }: { plans: GrowthMetrics['plans'] }) {
  return (
    <div className="flex flex-col justify-center gap-3">
      {plans.map((p) => (
        <div key={p.plan} className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 flex-shrink-0"
              style={{ backgroundColor: p.color }}
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/70 capitalize">
              {p.plan}
            </span>
          </div>
          <p className="text-white text-lg font-serif">
            {p.count}
            <span className="text-white/40 text-xs ml-2">
              {currency(p.mrr)}/mês
            </span>
          </p>
        </div>
      ))}
    </div>
  )
}

function FunnelView({ funnel }: { funnel: GrowthMetrics['funnel'] }) {
  return (
    <div className="space-y-3">
      {funnel.map((stage, i) => {
        const isLast = i === funnel.length - 1
        return (
          <div key={stage.stage} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                {stage.stage}
              </span>
              <span className="font-serif text-xl text-white">
                {stage.count}
                <span className="text-white/40 text-xs ml-2 font-mono">
                  {stage.percentage.toFixed(1)}%
                </span>
              </span>
            </div>
            <div className="h-2 bg-white/5 relative overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full transition-all ${isLast ? 'bg-yellow-400' : 'bg-white/60'}`}
                style={{ width: `${Math.min(100, stage.percentage)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
