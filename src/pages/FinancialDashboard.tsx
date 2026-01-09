import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowUpRight, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { Wallet, Transaction, FinancialOverview } from '@/types/database';

interface MonthlyData {
  month: string;
  revenue: number;
  fullDate: Date;
}

export default function FinancialDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [pageLoading, setPageLoading] = useState(true);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (!loading && user) {
      fetchFinancialData();
    }
  }, [user, loading, navigate]);

  const fetchFinancialData = async () => {
    if (!user) return;

    try {
      setPageLoading(true);

      // Fetch wallet data
      const { data: walletData } = await supabase
        .from('wallets' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletData) {
        setWallet(walletData as any as Wallet);
      }

      // Fetch recent transactions (limit 15)
      const { data: txData } = await supabase
        .from('transactions' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(15);

      if (txData) {
        setTransactions(txData as any as Transaction[]);
      }

      // Fetch monthly revenue overview (last 6 months)
      const { data: overviewData } = await supabase
        .from('financial_overview' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('period_type', 'monthly')
        .order('period_start', { ascending: true });

      if (overviewData) {
        const last6Months = (overviewData as any as FinancialOverview[]).slice(-6);
        const chartData: MonthlyData[] = last6Months.map((item: any) => ({
          month: new Date(item.period_start).toLocaleDateString('pt-BR', {
            month: 'short',
            year: '2-digit',
          }),
          revenue: item.net_revenue || 0,
          fullDate: new Date(item.period_start),
        }));
        setChartData(chartData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !wallet) return;

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0 || amount > wallet.available_balance) {
      alert('Valor de saque inválido');
      return;
    }

    try {
      setIsWithdrawing(true);

      const { error } = await supabase.from('payouts' as any).insert({
        user_id: user.id,
        amount: amount,
        fee: amount * 0.01,
        status: 'requested',
        bank_details: {},
      });

      if (error) {
        alert(`Erro ao criar pedido de saque: ${error.message}`);
        return;
      }

      alert('Pedido de saque criado! Você receberá em 1-2 dias úteis.');
      setWithdrawalAmount('');
      fetchFinancialData();
    } catch (error) {
      console.error('Erro ao processar saque:', error);
      alert('Erro ao processar saque');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header />
        <div className="flex items-center justify-center py-40">
          <p className="text-slate-500">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  const averageTicket =
    transactions.length > 0
      ? transactions.reduce((sum, t) => sum + t.net_amount, 0) / transactions.length
      : 0;

  const monthYear = selectedMonth.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="font-serif text-5xl lg:text-6xl font-bold text-black dark:text-white">
                Gestão Financeira
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                {monthYear}
              </p>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={selectedMonth.toISOString().split('T')[0].slice(0, 7)}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-');
                  setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1));
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-white"
              />
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Saldo Disponível */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-8">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-4">
                  Saldo Disponível
                </p>
                <div className="font-serif text-5xl font-bold text-black dark:text-white mb-4">
                  R$ {wallet?.available_balance?.toFixed(2) || '0,00'}
                </div>
                <Button
                  onClick={() => document.getElementById('withdraw-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-black text-white hover:bg-slate-800 dark:bg-white dark:text-black"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Sacar
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* A Liberar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-8">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-4">
                  A Liberar
                </p>
                <div className="font-serif text-5xl font-bold text-black dark:text-white">
                  R$ {wallet?.pending_balance?.toFixed(2) || '0,00'}
                </div>
                <p className="text-slate-500 dark:text-slate-500 text-xs mt-4">
                  Liquidação em 5-7 dias
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ticket Médio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-8">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-4">
                  Ticket Médio
                </p>
                <div className="font-serif text-5xl font-bold text-black dark:text-white">
                  R$ {averageTicket.toFixed(2)}
                </div>
                <p className="text-slate-500 dark:text-slate-500 text-xs mt-4">
                  Baseado em {transactions.length} transações
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Revenue Chart */}
        {chartData.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-8">
                <h2 className="font-serif text-3xl font-bold text-black dark:text-white mb-1">
                  Receita
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">
                  Últimos 6 meses
                </p>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="currentColor" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      opacity={0.1}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="currentColor"
                      className="text-slate-400"
                    />
                    <YAxis
                      stroke="currentColor"
                      className="text-slate-400"
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                      }}
                      formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="currentColor"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      className="text-black dark:text-white"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-8 text-center">
                <p className="text-slate-500 dark:text-slate-400 font-light">
                  Nenhuma movimentação financeira ainda
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-8">
              <h2 className="font-serif text-3xl font-bold text-black dark:text-white mb-8">
                Extrato Recente
              </h2>

              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400 font-medium text-sm">
                          Data
                        </th>
                        <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400 font-medium text-sm">
                          Serviço
                        </th>
                        <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400 font-medium text-sm">
                          Valor Total
                        </th>
                        <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400 font-medium text-sm">
                          Taxa
                        </th>
                        <th className="text-right py-4 px-4 text-slate-600 dark:text-slate-400 font-medium text-sm">
                          Sua Parte
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                        >
                          <td className="py-4 px-4 text-slate-700 dark:text-slate-300 text-sm">
                            {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-4 px-4 text-slate-700 dark:text-slate-300 text-sm">
                            {tx.type === 'charge' ? 'Serviço' : 'Ajuste'}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-serif font-semibold text-black dark:text-white">
                              R$ {tx.gross_amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-700 dark:text-slate-300 text-sm">
                            R$ {tx.platform_fee.toFixed(2)}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-serif font-bold text-black dark:text-white">
                              R$ {tx.net_amount.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 font-light text-center py-8">
                  Nenhuma transação registrada
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Withdrawal Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
          id="withdraw-section"
        >
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-8">
              <h2 className="font-serif text-3xl font-bold text-black dark:text-white mb-6">
                Solicitar Saque
              </h2>

              {wallet && wallet.available_balance > 0 ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium text-sm mb-2">
                      Valor (máx: R$ {wallet.available_balance.toFixed(2)})
                    </label>
                    <input
                      type="number"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-black dark:text-white font-serif text-lg"
                    />
                  </div>

                  <Button
                    onClick={handleWithdraw}
                    disabled={
                      isWithdrawing ||
                      parseFloat(withdrawalAmount) <= 0 ||
                      parseFloat(withdrawalAmount) > wallet.available_balance
                    }
                    className="w-full bg-black text-white hover:bg-slate-800 dark:bg-white dark:text-black text-base py-6"
                    size="lg"
                  >
                    {isWithdrawing ? 'Processando...' : 'Sacar Agora'}
                  </Button>

                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    O saque será processado em 1-2 dias úteis para sua conta bancária.
                  </p>
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400 font-light py-6">
                  Você não possui saldo disponível para saque no momento.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
