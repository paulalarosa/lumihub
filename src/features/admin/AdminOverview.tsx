import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    pendingPayouts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

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

      // Get pending payouts
      const { count: pendingCount } = await supabase
        .from('payouts' as any)
        .select('*', { count: 'exact' })
        .eq('status', 'requested');

      setStats({
        totalUsers: userCount || 0,
        totalRevenue: totalRev,
        activeSubscriptions: 0, // Would need subscription table
        pendingPayouts: pendingCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-gray-400">Carregando...</p>;
  }

  const statCards = [
    { label: 'Total de Usuários', value: stats.totalUsers, icon: Users, color: 'bg-blue-500/20 text-blue-400' },
    { label: 'Receita Total', value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'bg-[#00e5ff]/20 text-[#00e5ff]' },
    { label: 'Subscrições Ativas', value: stats.activeSubscriptions, icon: TrendingUp, color: 'bg-purple-500/20 text-purple-400' },
    { label: 'Saques Pendentes', value: stats.pendingPayouts, icon: AlertCircle, color: 'bg-red-500/20 text-red-400' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-[#1A1A1A] border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                    <p className="text-white font-serif text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-[#1A1A1A] border-white/10">
        <CardContent className="p-6">
          <h3 className="text-white font-serif text-xl font-bold mb-4">Últimos Eventos</h3>
          <p className="text-gray-400 text-sm">Logs de atividade sistema em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  );
}
