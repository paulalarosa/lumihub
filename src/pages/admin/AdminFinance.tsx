import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Payout, Transaction } from '@/types/database';

export default function AdminFinance() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Protect route
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch data
  useEffect(() => {
    if (user) {
      fetchPayouts();
      fetchTransactions();
    }
  }, [user]);

  const fetchPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('payouts' as any)
        .select('*')
        .order('requested_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPayouts(data || []);
    } catch (err) {
      console.error('Erro ao carregar saques:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar saques',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
    }
  };

  const handlePayoutAction = async (payoutId: string, newStatus: 'completed' | 'failed') => {
    try {
      setProcessingId(payoutId);

      const { error } = await supabase
        .from('payouts' as any)
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
        } as any)
        .eq('id', payoutId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Saque ${newStatus === 'completed' ? 'aprovado' : 'rejeitado'}`,
      });

      fetchPayouts();
    } catch (err) {
      console.error('Erro ao processar saque:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar o saque',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      requested: { icon: Clock, variant: 'default', label: 'Solicitado' },
      processing: { icon: Clock, variant: 'secondary', label: 'Processando' },
      completed: { icon: CheckCircle, variant: 'default', label: 'Concluído' },
      failed: { icon: XCircle, variant: 'destructive', label: 'Falhou' },
      canceled: { icon: XCircle, variant: 'outline', label: 'Cancelado' },
    };

    const config = variants[status] || variants.requested;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Financeiro
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Gerenciar saques, transações e movimentações financeiras
          </p>
        </div>

        {/* Tabs */}
        <Card>
          <Tabs defaultValue="payouts" className="w-full">
            <TabsList className="w-full justify-start p-0 border-b h-auto rounded-none">
              <TabsTrigger
                value="payouts"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Saques ({payouts.length})
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Transações ({transactions.length})
              </TabsTrigger>
            </TabsList>

            {/* Payouts Tab */}
            <TabsContent value="payouts" className="m-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-800">
                      <TableHead>ID</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <p className="text-slate-500">Nenhum saque encontrado</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      payouts.map((payout: any) => (
                        <TableRow
                          key={payout.id}
                          className="border-slate-200 dark:border-slate-800"
                        >
                          <TableCell className="font-mono text-sm">
                            {payout.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {payout.user_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(payout.amount)}
                          </TableCell>
                          <TableCell className="text-right text-slate-500">
                            {formatCurrency(payout.fee)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(payout.net_amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(payout.status)}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(payout.requested_at)}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {payout.status === 'requested' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handlePayoutAction(payout.id, 'completed')}
                                  disabled={processingId === payout.id}
                                >
                                  {processingId === payout.id ? '...' : 'Aprovar'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handlePayoutAction(payout.id, 'failed')}
                                  disabled={processingId === payout.id}
                                >
                                  {processingId === payout.id ? '...' : 'Rejeitar'}
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="m-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-800">
                      <TableHead>ID</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <p className="text-slate-500">Nenhuma transação encontrada</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx: any) => (
                        <TableRow
                          key={tx.id}
                          className="border-slate-200 dark:border-slate-800"
                        >
                          <TableCell className="font-mono text-sm">
                            {tx.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {tx.user_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="capitalize">
                            <Badge variant="outline">{tx.type}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(tx.gross_amount)}
                          </TableCell>
                          <TableCell className="text-right text-slate-500">
                            {formatCurrency(tx.platform_fee)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(tx.net_amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(tx.status)}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(tx.created_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AdminLayout>
  );
}
