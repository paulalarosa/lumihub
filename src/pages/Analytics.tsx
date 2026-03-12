import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { MetricCard } from '@/features/dashboard/components/MetricCard'
import { ClientGrowthChart } from '@/features/dashboard/components/ClientGrowthChart'
import { ClientsByCompanyChart } from '@/features/dashboard/components/ClientsByCompanyChart'
import { ClientStatusChart } from '@/features/dashboard/components/ClientStatusChart'
import {
  useClientStats,
  useClientGrowth,
  useClientsByCompany,
} from '@/hooks/useClientStats'

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useClientStats()
  const { data: growth, isLoading: growthLoading } = useClientGrowth()
  const { data: companies, isLoading: companiesLoading } = useClientsByCompany()

  return (
    <div className="min-h-screen bg-black font-mono selection:bg-white selection:text-black">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white hover:text-black rounded-none"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl text-white tracking-tight">
                    ANALYTICS
                  </h1>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-mono">
                    /// CLIENT INTELLIGENCE
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* KPI Cards */}
        <section className="mb-8">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-4">
            Métricas Principais
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total de Clientes"
              value={stats?.total ?? 0}
              icon={<Users className="h-4 w-4 text-white" />}
              loading={statsLoading}
            />
            <MetricCard
              title="Clientes Ativos"
              value={stats?.active ?? 0}
              subtitle={
                stats?.total
                  ? `${Math.round(((stats.active ?? 0) / stats.total) * 100)}% do total`
                  : undefined
              }
              icon={<UserCheck className="h-4 w-4 text-green-500" />}
              loading={statsLoading}
            />
            <MetricCard
              title="Novos (30 dias)"
              value={stats?.newLast30Days ?? 0}
              trend={stats?.growthRate}
              icon={<TrendingUp className="h-4 w-4 text-white" />}
              loading={statsLoading}
            />
            <MetricCard
              title="Inativos"
              value={stats?.inactive ?? 0}
              icon={<UserX className="h-4 w-4 text-neutral-500" />}
              loading={statsLoading}
            />
          </div>
        </section>

        {/* Charts Grid */}
        <section>
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-4">
            Visualizações
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ClientGrowthChart data={growth ?? []} loading={growthLoading} />
            <ClientStatusChart
              active={stats?.active ?? 0}
              inactive={stats?.inactive ?? 0}
              loading={statsLoading}
            />
            <div className="lg:col-span-2">
              <ClientsByCompanyChart
                data={companies ?? []}
                loading={companiesLoading}
              />
            </div>
          </div>
        </section>

        {/* Refresh Info */}
        <div className="mt-8 text-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
            Auto-refresh: 5 min
          </span>
        </div>
      </main>
    </div>
  )
}
