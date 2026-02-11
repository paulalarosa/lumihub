import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdminFinancials from '@/features/admin/AdminFinancials';

interface SubscriptionUser {
    id: string;
    full_name: string | null;
    email: string | null;
    plan: string | null;
    created_at: string | null;
}

export default function AdminSubscriptions() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<SubscriptionUser[]>([]);
    const [stats, setStats] = useState({
        mrr: 0,
        activeSubscribers: 0,
        churnRate: '0%',
        growth: '+0%'
    });

    const PLAN_PRICES = {
        free: 0,
        starter: 29.90,
        pro: 59.90,
        empire: 99.90
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (profiles) {
                setUsers(profiles);
                calculateStats(profiles);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: "Erro ao carregar dados",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (profiles: SubscriptionUser[]) => {
        let mrr = 0;
        let subscribers = 0;

        profiles.forEach(user => {
            const plan = (user.plan || 'free').toLowerCase();
            // Match against known plans to calculate MRR
            const price = PLAN_PRICES[plan as keyof typeof PLAN_PRICES] || 0;
            if (price > 0) {
                mrr += price;
                subscribers++;
            }
        });

        setStats({
            mrr,
            activeSubscribers: subscribers,
            churnRate: '2.4%', // Placeholder until we have cancellation data logs
            growth: '+12.5%' // Placeholder
        });
    };

    const handleUpdatePlan = async (userId: string, newPlan: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ plan: newPlan })
                .eq('id', userId);

            if (error) throw error;

            toast({
                title: "Plano atualizado",
                description: `Usuário alterado para ${newPlan}`
            });

            fetchData();
        } catch (error) {
            toast({
                title: "Erro ao atualizar plano",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <AdminFinancials stats={stats} loading={loading} />

            <Card className="bg-[#1A1A1A] border-white/10">
                <CardHeader>
                    <CardTitle className="text-white">Gerenciamento de Assinaturas</CardTitle>
                    <CardDescription className="text-gray-400">
                        Controle manual de planos e acesso
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 text-left">
                                    <th className="py-3 px-4 text-gray-400 font-medium text-sm">Usuário</th>
                                    <th className="py-3 px-4 text-gray-400 font-medium text-sm">Plano Atual</th>
                                    <th className="py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
                                    <th className="py-3 px-4 text-gray-400 font-medium text-sm text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-500">Carregando usuários...</td>
                                    </tr>
                                ) : users.map((user) => (
                                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className="text-white font-medium">{user.full_name || 'Sem nome'}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant="outline" className={`
                        ${user.plan === 'empire' ? 'border-amber-500 text-amber-500' :
                                                    user.plan === 'pro' ? 'border-[#00e5ff] text-[#00e5ff]' :
                                                        'border-gray-600 text-gray-400'}
                      `}>
                                                {(user.plan || 'free').toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                {user.plan && user.plan !== 'free' ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        <span className="text-green-500 text-sm">Ativo</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="w-4 h-4 text-gray-500" />
                                                        <span className="text-gray-500 text-sm">Gratuito</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {user.plan !== 'pro' && user.plan !== 'empire' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-[#00e5ff] border-[#00e5ff]/30 hover:bg-[#00e5ff]/10"
                                                        onClick={() => handleUpdatePlan(user.id, 'pro')}
                                                    >
                                                        <ArrowUpCircle className="w-4 h-4 mr-1" />
                                                        Dar Pro
                                                    </Button>
                                                )}
                                                {(user.plan === 'pro' || user.plan === 'empire') && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                        onClick={() => handleUpdatePlan(user.id, 'free')}
                                                    >
                                                        <ArrowDownCircle className="w-4 h-4 mr-1" />
                                                        Remover
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
