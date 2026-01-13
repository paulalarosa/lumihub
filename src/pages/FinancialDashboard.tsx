import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Plus, Minus, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TransactionDialog from '@/components/finance/TransactionDialog';
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  payment_method: string;
  created_at: string;
}

export default function FinancialDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState({
    income: 0,
    expense: 0,
    profit: 0
  });

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');

  // Chart Data
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch Transactions
      const { data, error } = await supabase
        .from('transactions' as any)
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const txs = (data || []) as any as Transaction[];
      setTransactions(txs);

      // Calculate Metrics (Total)
      const income = txs
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      const expense = txs
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      setMetrics({
        income,
        expense,
        profit: income - expense
      });

      // Prepare Chart Data (Last 6 Months)
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(), i);
        return {
          month: format(d, 'MMM', { locale: ptBR }),
          fullDate: d,
          income: 0,
          expense: 0
        };
      }).reverse();

      txs.forEach(tx => {
        const txDate = parseISO(tx.date);
        const monthEntry = last6Months.find(m =>
          txDate.getMonth() === m.fullDate.getMonth() &&
          txDate.getFullYear() === m.fullDate.getFullYear()
        );
        if (monthEntry) {
          if (tx.type === 'income') monthEntry.income += Number(tx.amount);
          if (tx.type === 'expense') monthEntry.expense += Number(tx.amount);
        }
      });

      setChartData(last6Months);

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-10 space-y-10">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-white font-light tracking-tight">
            Controle Financeiro
          </h1>
          <p className="text-white/40 mt-2 font-light">
            Gerencie suas receitas e despesas com inteligência.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => handleOpenDialog('expense')}
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-light"
          >
            <Minus className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>
          <Button
            onClick={() => handleOpenDialog('income')}
            className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 hover:text-emerald-300 transition-all font-light"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Receita
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Receita Total */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-[#101010] border-white/5 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-500 group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-emerald-400/80 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                  Total Receitas
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-3xl text-white tracking-tight">
                  R$ {metrics.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-sm text-white/40 font-light">
                  Acumulado
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Despesas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-[#101010] border-white/5 backdrop-blur-sm hover:border-red-500/30 transition-all duration-500 group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-red-500/10 text-red-400 group-hover:scale-110 transition-transform duration-500">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-red-400/80 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                  Total Despesas
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-3xl text-white tracking-tight">
                  R$ {metrics.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-sm text-white/40 font-light">
                  Acumulado
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lucro Líquido */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-[#101010] border-white/5 backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-500 group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform duration-500">
                  <DollarSign className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-cyan-400/80 bg-cyan-500/10 px-2 py-1 rounded-full border border-cyan-500/20">
                  Lucro Líquido
                </span>
              </div>
              <div className="space-y-1">
                <h3 className={`font-serif text-3xl tracking-tight ${metrics.profit >= 0 ? 'text-white' : 'text-red-400'}`}>
                  R$ {metrics.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-sm text-white/40 font-light">
                  Resultado final
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#101010] border-white/5">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-white mb-6 font-serif">Fluxo de Caixa (6 Meses)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#404040"
                    tick={{ fill: '#666' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#404040"
                    tick={{ fill: '#666' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' }}
                    cursor={{ fill: '#ffffff05' }}
                  />
                  <Bar dataKey="income" name="Receita" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Despesa" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#101010] border-white/5">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-white mb-6 font-serif">Últimas Transações</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {transactions.length === 0 ? (
                <div className="text-center py-10 text-white/20">
                  Nenhuma transação encontrada
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{tx.description}</p>
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <span>{format(parseISO(tx.date), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                          <span>•</span>
                          <span className="capitalize">{tx.category}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`font-medium ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <TransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        type={transactionType}
        onSuccess={fetchData}
      />
    </div>
  );
}
