import { Button } from '@/components/ui/button'
import { logger } from '@/services/logger'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { ClientsTable } from '@/features/clients/components/ClientsTable'
import { SearchBar } from '@/components/ui/SearchBar'
import { MetricCard } from '@/components/ui/MetricCard'
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssistantsTable } from '@/features/admin/components/AssistantsTable'
import { SystemLogs } from '@/features/admin/components/SystemLogs'
import { RevenueChart } from '@/components/ui/RevenueChart'

const ExampleMutationButton = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const handleAddTestClient = async () => {
    if (!user) return
    try {
      const randomId = Math.floor(Math.random() * 10000)
      await supabase.from('wedding_clients').insert({
        user_id: user.id,
        name: `Test Client ${randomId}`,
        full_name: `Test Client ${randomId}`,
        email: `test${randomId}@example.com`,
        phone: '11999999999',
        wedding_date: new Date().toISOString(),
        status: 'lead', // Default to lead for test
      })

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
    } catch (error) {
      logger.error(error, 'AdminDashboard.handleAddTestClient', {
        showToast: false,
      })
    }
  }

  return (
    <Button
      onClick={handleAddTestClient}
      className="bg-yellow-500 text-black hover:bg-yellow-400 font-mono text-xs uppercase rounded-none border border-yellow-300"
    >
      ⚡ ADD TEST CLIENT
    </Button>
  )
}

export default function AdminDashboard() {
  const { data: metrics, isLoading: dataLoading } = useDashboardMetrics()

  return (
    <div className="p-6 min-h-screen bg-black text-white selection:bg-yellow-500 selection:text-black">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-[1px] w-12 bg-yellow-500" />
          <span className="font-mono uppercase tracking-[0.3em] text-yellow-500 text-xs">
            System Area
          </span>
        </div>
        <h1 className="font-serif text-5xl tracking-tight text-white mb-4">
          COMMAND CENTER // ADMIN
        </h1>
      </div>

      {/* Phase 3: HUD Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <MetricCard
          label="TOTAL CLIENTS"
          value={metrics?.totalClients || 0}
          isLoading={dataLoading}
        />
        <MetricCard
          label="ACTIVE CONTRACTS"
          value={metrics?.activeContracts || 0}
          isLoading={dataLoading}
          className="border-yellow-500/50"
        />
        <MetricCard
          label="POTENTIAL LEADS"
          value={metrics?.leads || 0}
          isLoading={dataLoading}
        />
      </div>

      {/* FINANCIAL PROJECTION CHART */}
      <div className="border border-white/10 bg-white/5 mb-12">
        <div className="bg-black/40 p-3 flex justify-between items-center border-b border-white/10">
          <span className="text-white font-mono text-xs uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            Financial Projection // Q1
          </span>
          <span className="text-white/40 font-mono text-[10px]">
            ESTIMATED REVENUE
          </span>
        </div>
        <div className="p-6 h-[300px] bg-white">
          <RevenueChart className="h-full w-full" />
        </div>
      </div>

      <Tabs defaultValue="clients" className="w-full">
        <div className="flex items-center justify-between mb-6 border-b border-white/10">
          <TabsList className="bg-transparent p-0 h-auto rounded-none">
            <TabsTrigger
              value="clients"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 text-white/60 uppercase font-mono tracking-wider px-6 py-3"
            >
              Clients Database
            </TabsTrigger>
            <TabsTrigger
              value="assistants"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 text-white/60 uppercase font-mono tracking-wider px-6 py-3"
            >
              Team / Assistants
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 text-white/60 uppercase font-mono tracking-wider px-6 py-3"
            >
              System Logs
            </TabsTrigger>
          </TabsList>

          {import.meta.env.DEV && <ExampleMutationButton />}
        </div>

        <TabsContent value="clients" className="mt-0">
          <div className="mb-12 p-6 border border-white/10 bg-white/5 rounded-none relative group">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-white/60 text-sm uppercase tracking-wider">
                  Client Management
                </h3>
              </div>
              <SearchBar />
              <ClientsTable />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assistants" className="mt-0">
          <div className="p-6 border border-white/10 bg-white/5 rounded-none">
            <AssistantsTable />
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-0">
          <div className="p-6 border border-white/10 bg-white/5 rounded-none">
            <h3 className="font-mono text-white/60 text-sm uppercase tracking-wider mb-6">
              Recent System Activity
            </h3>
            <SystemLogs />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
