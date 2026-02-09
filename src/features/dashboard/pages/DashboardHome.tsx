import { useAuthStore } from "@/stores/useAuthStore";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { SummaryHeader } from "../components/SummaryHeader";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function DashboardHome() {
    const { user } = useAuthStore();
    const {
        totalBudgets,
        avgWeddingValue,
        weddingsNext90Days,
        leadsConversion,
        loading
    } = useDashboardStats();

    // Empty State Check
    // If no clients and no budget, assume empty state (new account)
    const isEmptyState = !loading && leadsConversion.total === 0 && totalBudgets === 0;

    const metrics = [
        {
            label: "Orçamentos Geridos",
            value: totalBudgets.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            subtext: "Total acumulado",
            trend: 'neutral' as const
        },
        {
            label: "Ticket Médio",
            value: avgWeddingValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            subtext: "Por Casamento",
            trend: 'up' as const
        },
        {
            label: "Próximos 90 Dias",
            value: weddingsNext90Days.toString(),
            subtext: "Casamentos Agendados",
            trend: 'neutral' as const
        },
        {
            label: "Conversão",
            value: `${leadsConversion.converted}/${leadsConversion.total}`,
            subtext: `${leadsConversion.pending} Pendentes`,
            trend: 'neutral' as const
        }
    ];

    if (loading) {
        return (
            <div className="p-8 text-white font-mono text-center animate-pulse">
                INITIALIZING DASHBOARD INTELLIGENCE...
            </div>
        );
    }

    if (isEmptyState) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-[#000000]">
                <div className="max-w-md text-center">
                    <h2 className="text-white font-serif text-3xl mb-4 tracking-tight">
                        Bem-vinda ao KONTROL
                    </h2>
                    <p className="text-[#666666] mb-8 font-light">
                        Nenhuma noiva cadastrada. Inicie o fluxo de gestão para desbloquear a inteligência do sistema.
                    </p>
                    <Link to="/clientes/novo">
                        <Button className="bg-white text-black hover:bg-gray-200 rounded-none px-8 py-6 uppercase tracking-widest text-xs font-bold transition-all hover:scale-105">
                            <Plus className="w-4 h-4 mr-2" />
                            Cadastrar Primeira Noiva
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header / Context */}
            <div className="flex flex-col gap-2 mb-8">
                <span className="text-[#444444] font-mono text-xs uppercase tracking-[0.3em]">
                    Intelligence Hub
                </span>
                <h1 className="text-white font-serif text-4xl">
                    Dashboard
                </h1>
            </div>

            {/* 4 Cards Intelligence */}
            <SummaryHeader metrics={metrics} />

            {/* Additional Content Area (Placeholder for now, preserving 'Industrial Noir' emptiness if not specified) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#050505] border border-[#111] p-6 min-h-[300px] flex items-center justify-center text-[#222] font-mono text-xs uppercase tracking-widest">
                    Analytics Visualization (Pending)
                </div>
                <div className="bg-[#050505] border border-[#111] p-6 min-h-[300px] flex items-center justify-center text-[#222] font-mono text-xs uppercase tracking-widest">
                    Recent Activity (Pending)
                </div>
            </div>
        </div>
    );
}
