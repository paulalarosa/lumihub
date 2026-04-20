import { lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Terminal, Users, TrendingUp, UserPlus } from 'lucide-react'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'
import { useAdminNotifications } from '@/hooks/useAdminNotifications'
import { MetricCard } from '@/features/dashboard/components/MetricCard'
import { AdminMRRPanel } from './components/AdminMRRPanel'
import { AdminDeletionRequests } from './components/AdminDeletionRequests'

const RevenueChart = lazy(() =>
  import('@/components/ui/revenue-chart').then((m) => ({
    default: m.RevenueChart,
  })),
)

export default function AdminOverview() {
  const { data: stats, isLoading } = useAdminDashboard()
  const { notifications } = useAdminNotifications()

  const recentActivity = notifications.slice(0, 10).map((n) => {
    const time = new Date(n.created_at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    const tag =
      n.type === 'new_signup'
        ? '[USER]'
        : n.type === 'payment_received'
          ? '[PAY]'
          : '[LOG]'
    return `> [${time}] ${tag} ${n.message}`
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin h-6 w-6 border-2 border-foreground border-t-transparent rounded-full" />
        <p className="text-muted-foreground font-mono text-xs uppercase animate-pulse">
          Initializing_Dashboard_Metrics...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminMRRPanel />

      <AdminDeletionRequests />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="TOTAL USERS"
          value={stats?.total_users ?? 0}
          loading={isLoading}
        />
        <MetricCard
          title="MRR"
          value={`R$ ${(stats?.mrr ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          loading={isLoading}
          className="border-yellow-500/50"
        />
        <MetricCard
          title="ACTIVE SUBS"
          value={stats?.active_subscriptions ?? 0}
          loading={isLoading}
        />
        <MetricCard
          title="CHURN RATE"
          value={`${stats?.churn_rate ?? 0}%`}
          loading={isLoading}
        />
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-background border border-border rounded-none shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-zinc-900 border border-white/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Hoje
              </p>
              <p className="text-2xl font-serif text-white">
                {stats?.new_users_today ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background border border-border rounded-none shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-zinc-900 border border-white/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Esta semana
              </p>
              <p className="text-2xl font-serif text-white">
                {stats?.new_users_week ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background border border-border rounded-none shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-zinc-900 border border-white/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Últimos 30 dias
              </p>
              <p className="text-2xl font-serif text-white">
                {stats?.new_users_month ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2 border border-border bg-black/40 backdrop-blur-sm">
          <div className="bg-zinc-900/50 p-3 flex justify-between items-center border-b border-border">
            <span className="text-white font-mono text-xs uppercase tracking-[0.2em] flex items-center gap-2 font-bold">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
              Revenue
            </span>
            <span className="text-zinc-500 font-mono text-[10px] tracking-tight">
              MRR: R$ {(stats?.mrr ?? 0).toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="p-6 h-[340px]">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center animate-pulse">
                  <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <RevenueChart
                className="h-full w-full"
                overrideMetrics={{
                  activeContracts: stats?.active_subscriptions ?? 0,
                  leads:
                    (stats?.total_users ?? 0) -
                    (stats?.active_subscriptions ?? 0),
                  subtitle: 'SaaS REVENUE',
                }}
              />
            </Suspense>
          </div>
        </div>

        {}
        <div className="flex flex-col gap-6">
          <Card className="bg-background border border-border rounded-none flex-1 shadow-none">
            <CardHeader className="border-b border-border pb-4 bg-zinc-900/30">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-white" />
                <CardTitle className="text-white font-mono text-[11px] uppercase tracking-[0.3em] font-bold">
                  Live Feed
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-black/20 font-mono text-[10px] p-4 overflow-y-auto max-h-[220px] custom-scrollbar">
              <div className="space-y-2.5">
                {recentActivity.length > 0 ? (
                  recentActivity.map((log, i) => (
                    <div
                      key={i}
                      className="text-green-500/80 border-l-2 border-green-900/50 pl-3 py-0.5 hover:bg-white/5 transition-colors"
                    >
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-zinc-600 pl-3 py-1 italic">
                    &gt; Nenhuma atividade recente
                  </div>
                )}
                <div className="text-zinc-700 animate-pulse pl-3 pt-2">
                  &gt; _ Waiting for new telemetry...
                </div>
              </div>
            </CardContent>
          </Card>

          {}
          <Card className="bg-background border border-border rounded-none shadow-none">
            <CardHeader className="border-b border-border pb-4 bg-zinc-900/30">
              <CardTitle className="text-white font-mono text-[11px] uppercase tracking-[0.3em] font-bold">
                Distribuição de Planos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {(stats?.plan_distribution ?? []).map((p) => {
                const total = stats?.total_users ?? 1
                const pct = Math.round((p.count / total) * 100)
                return (
                  <div key={p.plan} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                        {p.plan}
                      </span>
                      <span className="font-mono text-[9px] text-zinc-600 font-bold">
                        {p.count}
                      </span>
                    </div>
                    <div className="h-1 bg-zinc-900 w-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {}
      <Card className="bg-background border border-border rounded-none shadow-none overflow-hidden">
        <CardHeader className="border-b border-border bg-zinc-900/30">
          <CardTitle className="text-white font-mono text-[11px] uppercase tracking-[0.3em] font-bold">
            Últimos Cadastros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-black/40">
                  <th className="text-left py-4 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                    Usuário telemetry
                  </th>
                  <th className="text-left py-4 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                    Link_Plano
                  </th>
                  <th className="text-left py-4 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                    Stamp_Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recent_signups ?? []).map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-serif text-white text-sm tracking-tight group-hover:text-yellow-500 transition-colors">
                          {u.full_name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-600 tracking-tighter">
                          {u.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 bg-zinc-900 border border-white/10 font-mono text-[10px] text-white uppercase tracking-wider">
                        {u.plan || 'NONE'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-zinc-600 text-[10px] font-mono uppercase">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

