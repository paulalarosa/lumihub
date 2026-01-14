import { useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Users, TrendingUp } from "lucide-react";

interface FinancialStats {
    mrr: number;
    activeSubscribers: number;
    churnRate: string;
    growth: string;
}

interface AdminFinancialsProps {
    stats: FinancialStats;
    loading: boolean;
}

export default function AdminFinancials({ stats, loading }: AdminFinancialsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="bg-[#1A1A1A] border-white/10">
                        <CardContent className="pt-6 h-32 animate-pulse bg-white/5" />
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-[#1A1A1A] border-white/10">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-sm">MRR (Receita Mensal)</p>
                            <h3 className="text-2xl font-bold text-white mt-2">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.mrr)}
                            </h3>
                        </div>
                        <div className="p-2 bg-[#00e5ff]/10 rounded-lg">
                            <CreditCard className="w-5 h-5 text-[#00e5ff]" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-white/10">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-sm">Assinantes Ativos</p>
                            <h3 className="text-2xl font-bold text-white mt-2">{stats.activeSubscribers}</h3>
                        </div>
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Users className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-white/10">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-sm">Churn Rate</p>
                            <h3 className="text-2xl font-bold text-red-400 mt-2">{stats.churnRate}</h3>
                        </div>
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-red-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
