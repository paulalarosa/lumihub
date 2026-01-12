import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, FolderOpen, ArrowUpRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '@/layouts/AdminLayout';

interface MetricCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Protect route
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch metrics
  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [user]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Total Revenue
      const { data: transactionData } = await supabase
        .from('transactions' as any)
        .select('net_amount')
        .eq('type', 'charge')
        .eq('status', 'completed');

      const totalRevenue = (transactionData as any)?.reduce(
        (sum: number, t: any) => sum + (t.net_amount || 0),
        0
      ) || 0;

      // Total Users
      const { count: userCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact' });

      // Active Projects
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .in('status', ['planning', 'in_progress']);

      // Pending Payouts
      const { count: payoutCount } = await supabase
        .from('payouts' as any)
        .select('*', { count: 'exact' })
        .eq('status', 'requested');

      setMetrics([
        {
          title: 'Receita Total',
          value: new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(totalRevenue),
          icon: <DollarSign className="w-6 h-6" />,
          color: 'from-green-500 to-emerald-600',
          trend: 12,
        },
        {
          title: 'Usuários Totais',
          value: userCount || 0,
          icon: <Users className="w-6 h-6" />,
          color: 'from-blue-500 to-cyan-600',
          trend: 8,
        },
        {
          title: 'Projetos Ativos',
          value: projectCount || 0,
          icon: <FolderOpen className="w-6 h-6" />,
          color: 'from-purple-500 to-pink-600',
          trend: 5,
        },
        {
          title: 'Saques Pendentes',
          value: payoutCount || 0,
          icon: <ArrowUpRight className="w-6 h-6" />,
          color: 'from-orange-500 to-red-600',
          trend: -2,
        },
      ]);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
      setError('Erro ao carregar métricas do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Visão Geral
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Acompanhe as principais métricas da plataforma
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Metrics Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {metrics.map((metric, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`h-1 bg-gradient-to-r ${metric.color}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {metric.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color} text-white`}>
                      {metric.icon}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {loading ? '...' : metric.value}
                    </div>
                    {metric.trend !== undefined && (
                      <div className="flex items-center gap-1 text-sm">
                        <TrendingUp
                          className={`w-4 h-4 ${
                            metric.trend >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        />
                        <span
                          className={
                            metric.trend >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }
                        >
                          {metric.trend >= 0 ? '+' : ''}{metric.trend}% vs. mês anterior
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/admin/usuarios')}
              className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition text-left"
            >
              <div className="font-semibold text-slate-900 dark:text-white">
                Gerenciar Usuários
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Ver lista de usuários e permissões
              </p>
            </button>

            <button
              onClick={() => navigate('/admin/financeiro')}
              className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 transition text-left"
            >
              <div className="font-semibold text-slate-900 dark:text-white">
                Gerenciar Financeiro
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Aprovar saques e transações
              </p>
            </button>

            <button
              onClick={() => navigate('/admin/configuracoes')}
              className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition text-left"
            >
              <div className="font-semibold text-slate-900 dark:text-white">
                Configurações
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Gerenciar feature flags
              </p>
            </button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
