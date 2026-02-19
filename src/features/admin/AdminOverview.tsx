import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, AlertCircle, Terminal } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { MetricCard } from '@/components/ui/MetricCard';
import { RevenueChart } from "@/components/ui/RevenueChart";

export default function AdminOverview() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    churnRate: 2.1, // Mock
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<string[]>([]);

  useEffect(() => {
    fetchStats();
    // Simulate live feed
    generateLiveFeed();
  }, []);

  const generateLiveFeed = () => {
    const actions = [
      "User profile updated [ID: 8821]",
      "New pending contract generated",
      "System backup completed successfully",
      "API Latency spike detected (150ms)",
      "New login from São Paulo, BR",
      "Subscription upgraded to PRO"
    ];

    // Add fake historical logs
    const initialLogs = Array(6).fill(0).map((_, i) => {
      const time = new Date(Date.now() - i * 1000 * 60 * 5).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `> [${time}] ${actions[i % actions.length]}`;
    });
    setActivities(initialLogs);
  };

  const fetchStats = async () => {
    try {
      // Get total users from profiles table
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Get total revenue from transactions
      const { data: transactionData } = await supabase
        .from('transactions')
        .select('net_amount')
        .eq('status', 'completed');

      const totalRev = transactionData?.reduce((sum, t) => sum + (t.net_amount || 0), 0) || 0;

      setStats(prev => ({
        ...prev,
        totalUsers: userCount || 0,
        totalRevenue: totalRev,
        activeSubscriptions: Math.floor((userCount || 0) * 0.4), // Mock 40% conversion
      }));
    } catch (error) {
      logger.error(error, 'AdminOverview.fetchStats', { showToast: false });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
        <p className="text-gray-500 font-mono text-xs uppercase animate-pulse">Initializing_Dashboard_Metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* 1. HUD Grid (Restored from Legacy) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          label="TOTAL USERS"
          value={stats.totalUsers}
          isLoading={loading}
        />
        <MetricCard
          label="TOTAL REVENUE"
          value={`R$ ${stats.totalRevenue.toFixed(0)}`}
          isLoading={loading}
          className="border-yellow-500/50"
        />
        <MetricCard
          label="ACTIVE SUBS"
          value={stats.activeSubscriptions}
          isLoading={loading}
        />
        <MetricCard
          label="CHURN RATE"
          value={`${stats.churnRate}%`}
          isLoading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 2. Global Revenue Chart (Restored from Legacy) */}
        <div className="lg:col-span-2 border border-white/10 bg-white/5">
          <div className="bg-black/40 p-3 flex justify-between items-center border-b border-white/10">
            <span className="text-white font-mono text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              Financial Projection // SaaS
            </span>
            <span className="text-white/40 font-mono text-[10px]">
              ESTIMATED MRR
            </span>
          </div>
          <div className="p-6 h-[340px] bg-white">
            {/* Inject Global Stats into Revenue Chart */}
            <RevenueChart
              className="h-full w-full"
              overrideMetrics={{
                activeContracts: stats.activeSubscriptions,
                leads: stats.totalUsers - stats.activeSubscriptions, // "Leads" mapped to Non-Subscribers
                subtitle: "SaaS REVENUE"
              }}
            />
          </div>
        </div>

        {/* 3. Quick Actions & Live Feed (New Features) */}
        <div className="flex flex-col gap-6">
          <Card className="bg-black border border-white/20 rounded-none flex-1">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-white" />
                <CardTitle className="text-white font-serif text-lg tracking-tight">{t('admin_live_feed')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-[#0a0a0a] font-mono text-xs p-4 overflow-y-auto max-h-[220px]">
              <div className="space-y-2">
                {activities.map((log, i) => (
                  <div key={i} className="text-green-500/80 border-l-2 border-green-900 pl-3 py-1 hover:bg-white/5 transition-colors">
                    {log}
                  </div>
                ))}
                <div className="text-green-500/50 animate-pulse pl-3 pt-2">
                  &gt; _ Waiting for new events...
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border border-white/20 rounded-none">
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle className="text-white font-serif text-lg tracking-tight">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <button className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white hover:text-black border border-white/10 text-white font-mono text-xs uppercase tracking-wider transition-colors">
                [ VIEW PENDING APPROVALS ]
              </button>
              <button className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white hover:text-black border border-white/10 text-white font-mono text-xs uppercase tracking-wider transition-colors">
                [ BROADCAST MESSAGE ]
              </button>
              <button className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white hover:text-black border border-white/10 text-white font-mono text-xs uppercase tracking-wider transition-colors">
                [ SYSTEM DIAGNOSTICS ]
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
