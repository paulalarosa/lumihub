import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, AlertCircle, Activity, Terminal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
        .from('transactions' as any)
        .select('net_amount')
        .eq('status', 'completed');

      const totalRev = (transactionData as any)?.reduce((sum: number, t: any) => sum + (t.net_amount || 0), 0) || 0;

      setStats(prev => ({
        ...prev,
        totalUsers: userCount || 0,
        totalRevenue: totalRev,
        activeSubscriptions: Math.floor((userCount || 0) * 0.4), // Mock 40% conversion
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  const statCards = [
    { label: t('admin_menu_users'), value: stats.totalUsers, icon: Users, change: "+12% this week" },
    { label: "Receita Total", value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, change: "+5% vs last month" },
    { label: t('admin_menu_subscriptions'), value: stats.activeSubscriptions, icon: TrendingUp, change: "Stable" },
    { label: "Churn Rate", value: `${stats.churnRate}%`, icon: AlertCircle, change: "-0.5% improvement" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-black border border-white/20 rounded-none group hover:border-white transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                <Icon className="h-8 w-8 text-white" />
              </div>
              <CardContent className="p-6 relative z-10">
                <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-white font-serif text-3xl font-light">{stat.value}</p>
                <p className="text-[10px] text-green-500 font-mono mt-2">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-black border border-white/20 rounded-none h-full">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-white" />
                <CardTitle className="text-white font-serif text-lg tracking-tight">{t('admin_live_feed')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-[#0a0a0a] min-h-[300px] font-mono text-xs p-4">
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
        </div>

        <div>
          <Card className="bg-black border border-white/20 rounded-none h-full">
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle className="text-white font-serif text-lg tracking-tight">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <p className="text-gray-500 text-xs font-mono mb-4">Shortcuts for common tasks</p>

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
