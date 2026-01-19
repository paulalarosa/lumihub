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
import { ArrowUpRight, ArrowDownRight, Plus, Minus, DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TransactionDialog from '@/components/finance/TransactionDialog';
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
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
          month: format(d, 'MMM', { locale: ptBR }).toUpperCase(),
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
    <div className="min-h-screen bg-black text-white p-6 lg:p-10 space-y-10 selection:bg-white selection:text-black">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/20 pb-6">
        <div>
          <h1 className="font-serif text-3xl md:text-5xl text-white tracking-tighter uppercase mb-2">
            {t('pages.finance.title')}
          </h1>
          <p className="text-white/40 font-mono text-xs uppercase tracking-widest">
            {t('pages.finance.subtitle')}
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => handleOpenDialog('expense')}
            variant="outline"
            className="rounded-none border-white/20 text-white hover:bg-white hover:text-black transition-all font-mono text-xs uppercase"
          >
            <Minus className="mr-2 h-4 w-4" />
            {t('pages.finance.log_expense')}
          </Button>
          <Button
            onClick={() => handleOpenDialog('income')}
            className="rounded-none bg-white text-black hover:bg-white/80 transition-all font-mono text-xs uppercase"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('pages.finance.add_income')}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Receita Total */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-black border border-white/20 rounded-none group hover:border-white transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 border border-white/10 group-hover:bg-white group-hover:text-black transition-colors duration-300">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/50 border border-white/10 px-2 py-1">
                  {t('pages.finance.income')}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-3xl text-white tracking-tight">
                  R$ {metrics.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Despesas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-black border border-white/20 rounded-none group hover:border-white transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 border border-white/10 group-hover:bg-white group-hover:text-black transition-colors duration-300">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/50 border border-white/10 px-2 py-1">
                  {t('pages.finance.expense')}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-3xl text-white tracking-tight">
                  R$ {metrics.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lucro Líquido */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-black border border-white/20 rounded-none group hover:border-white transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 border border-white/10 group-hover:bg-white group-hover:text-black transition-colors duration-300">
                  <Wallet className="h-5 w-5" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/50 border border-white/10 px-2 py-1">
                  NET_PROFIT
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-3xl text-white tracking-tight">
                  R$ {metrics.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black border border-white/20 rounded-none">
          <CardContent className="p-6">
            <h3 className="text-lg text-white mb-6 font-mono uppercase tracking-widest">CASH_FLOW (6 MONTHS)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} stroke="#fff" />
                  <XAxis
                    dataKey="month"
                    stroke="#666"
                    tick={{ fill: '#666', fontFamily: 'JetBrains Mono', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#666"
                    tick={{ fill: '#666', fontFamily: 'JetBrains Mono', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `K${(value / 1000).toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #fff', borderRadius: '0px', color: '#fff', fontFamily: 'JetBrains Mono' }}
                    cursor={{ fill: '#ffffff10' }}
                  />
                  <Bar dataKey="income" name="INCOME" fill="#ffffff" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="expense" name="EXPENSE" fill="#333333" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border border-white/20 rounded-none">
          <CardContent className="p-6">
            <h3 className="text-lg text-white mb-6 font-mono uppercase tracking-widest">LATEST_TRANSACTIONS</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {transactions.length === 0 ? (
                <div className="text-center py-10 text-white/20 font-mono uppercase text-xs">
                  NO_DATA_FOUND
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 border border-white/5 hover:border-white/30 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 border border-white/10 group-hover:border-white transition-colors`}>
                        {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-white" /> : <ArrowDownRight className="h-4 w-4 text-white/50" />}
                      </div>
                      <div>
                        <p className="text-white font-mono text-xs uppercase tracking-wide">{tx.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono uppercase">
                          <span>{format(parseISO(tx.date), "dd MMM yyyy", { locale: ptBR })}</span>
                          <span>//</span>
                          <span className="capitalize">{tx.category}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`font-mono text-sm ${tx.type === 'income' ? 'text-white' : 'text-white/50'}`}>
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
