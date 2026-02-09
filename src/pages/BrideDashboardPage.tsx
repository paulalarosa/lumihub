import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
    LogOut,
    CheckCircle2,
    CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrideData {
    id: string;
    name: string;
    wedding_date: string | null;
}

interface Event {
    id: string;
    title: string;
    event_date: string;
    event_type: string | null;
}

export default function BrideDashboardPage() {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [bride, setBride] = useState<BrideData | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [daysLeft, setDaysLeft] = useState<number>(0);

    // Financials
    const [totalContract, setTotalContract] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);

    useEffect(() => {
        // Validate Session
        const isAuth = localStorage.getItem(`bride_auth_${clientId}`);
        if (!isAuth) {
            navigate(`/portal/${clientId}/login`);
            return;
        }

        if (clientId) fetchData();
    }, [clientId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Client Info
            const { data: clientData, error: clientError } = await supabase
                .from("wedding_clients")
                .select("id, name, wedding_date")
                .eq("id", clientId)
                .single();

            if (clientError) throw clientError;
            setBride(clientData);

            if (clientData.wedding_date) {
                const diff = differenceInDays(new Date(clientData.wedding_date), new Date());
                setDaysLeft(diff > 0 ? diff : 0);
            }

            // 2. Fetch Events
            const { data: eventsData, error: eventsError } = await supabase
                .from("events")
                .select("id, title, event_date, event_type")
                .eq("client_id", clientId)
                .order("event_date", { ascending: true });

            if (eventsError) console.error(eventsError);
            setEvents(eventsData || []);

            // 3. Fetch Financials (Simplified logic)
            if (eventsData && eventsData.length > 0) {
                const { data: eventsWithProject } = await supabase
                    .from("events")
                    .select("project_id, total_value")
                    .eq("client_id", clientId);

                if (eventsWithProject) {
                    const totalVal = eventsWithProject.reduce((sum, e) => sum + (e.total_value || 0), 0);
                    setTotalContract(totalVal);

                    const projectIds = eventsWithProject.map(e => e.project_id).filter(Boolean);

                    if (projectIds.length > 0) {
                        const { data: invoices } = await supabase
                            .from("invoices")
                            .select("amount, status")
                            .in("project_id", projectIds)
                            .eq("status", "paid");

                        const paid = invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
                        setPaidAmount(paid);
                    }
                }
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const remaining = totalContract - paidAmount;
    const progress = totalContract > 0 ? (paidAmount / totalContract) * 100 : 0;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Loading System</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-white selection:text-black flex flex-col">

            {/* Header / Navbar */}
            <header className="border-b border-neutral-800 bg-neutral-950">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div>
                        <span className="font-serif italic text-xl tracking-tight text-white">KONTROL Bride</span>
                    </div>
                    <Button
                        variant="ghost"
                        className="text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white hover:bg-transparent rounded-none"
                        onClick={() => {
                            localStorage.setItem(`bride_auth_${clientId}`, "");
                            navigate(`/portal/${clientId}/login`);
                        }}
                    >
                        <LogOut className="w-3 h-3 mr-2" />
                        Sair
                    </Button>
                </div>
            </header>

            {/* Main Grid Layout */}
            <main className="flex-1 container mx-auto px-6 py-12 md:py-20">

                <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-l border-neutral-800">

                    {/* COL 1: Welcome & Countdown (Span 5) */}
                    <div className="lg:col-span-5 border-r border-b border-neutral-800 p-8 md:p-12 min-h-[400px] flex flex-col justify-between relative bg-neutral-950">

                        {/* Greeting */}
                        <div className="mb-12">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4">Bem-vinda</p>
                            <h1 className="text-4xl md:text-5xl font-serif text-white leading-tight">
                                Olá, <span className="italic text-neutral-400">{bride?.name ? bride.name.split(' ')[0] : 'Noiva'}</span>
                            </h1>
                        </div>

                        {/* Countdown */}
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">Contagem Regressiva</p>
                            <div className="flex items-baseline gap-4">
                                <span className="text-8xl md:text-9xl font-serif text-white leading-none tracking-tighter">
                                    {daysLeft}
                                </span>
                                <span className="text-sm md:text-base font-mono text-neutral-500 rotate-90 origin-left translate-y-[-20px]">
                                    DIAS
                                </span>
                            </div>

                            {bride?.wedding_date && (
                                <div className="mt-8 flex items-center gap-2 text-neutral-400 font-mono text-xs">
                                    <CalendarDays className="w-3 h-3" />
                                    {format(new Date(bride.wedding_date), "dd . MM . yyyy", { locale: ptBR })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COL 2: Timeline & Financials (Span 7) */}
                    <div className="lg:col-span-7 grid grid-rows-2">

                        {/* ROW 1: Timeline */}
                        <div className="border-r border-b border-neutral-800 p-8 md:p-12 bg-neutral-950">
                            <h3 className="text-lg font-serif italic text-white mb-8">Sua Jornada</h3>

                            <div className="space-y-6 max-h-[250px] overflow-y-auto scrollbar-thin pr-4">
                                {events.map((evt, idx) => {
                                    const isPast = new Date(evt.event_date) < new Date();
                                    return (
                                        <div key={evt.id} className="flex gap-6 group">
                                            {/* Date */}
                                            <div className="w-24 shrink-0 text-right pt-1">
                                                <span className={`font-mono text-xs ${isPast ? 'text-neutral-500 line-through' : 'text-white'}`}>
                                                    {format(new Date(evt.event_date), "dd MMM")}
                                                </span>
                                            </div>

                                            {/* Line */}
                                            <div className="relative flex flex-col items-center">
                                                <div className={`w-1.5 h-1.5 rounded-none border border-current ${isPast ? 'bg-neutral-800 border-neutral-800' : 'bg-white border-white'} z-10`} />
                                                {idx !== events.length - 1 && (
                                                    <div className="w-[1px] h-full bg-neutral-900 absolute top-2" />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="pb-6 pt-0.5">
                                                <p className={`text-sm uppercase tracking-wider ${isPast ? 'text-neutral-600' : 'text-white'}`}>
                                                    {evt.title}
                                                </p>
                                                {isPast && (
                                                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest text-gold mt-1">
                                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                                        Concluído
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                                {events.length === 0 && (
                                    <p className="text-neutral-600 text-xs font-mono">Nenhum evento agendado.</p>
                                )}
                            </div>
                        </div>

                        {/* ROW 2: Financial Stats */}
                        <div className="border-r border-b border-neutral-800 p-8 md:p-12 bg-neutral-950 flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-serif italic text-white">Financeiro</h3>
                                {remaining <= 0 && totalContract > 0 && (
                                    <span className="text-[10px] uppercase tracking-widest border border-gold text-gold px-2 py-1">
                                        Quitado
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-6">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Total</p>
                                    <p className="text-2xl font-light text-white">
                                        R$ {totalContract.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Pago</p>
                                    <p className="text-2xl font-light text-white">
                                        R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                    </p>
                                </div>
                            </div>

                            <div className="relative w-full h-1 bg-neutral-900">
                                <div
                                    className="absolute top-0 left-0 h-full bg-white transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="mt-2 flex justify-between text-[9px] uppercase tracking-widest text-neutral-600 font-mono">
                                <span>Progresso</span>
                                <span>{Math.round(progress)}%</span>
                            </div>

                            {remaining > 0 && (
                                <p className="mt-4 text-[10px] text-neutral-500 font-mono">
                                    Restante: R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            )}
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-[9px] text-neutral-700 uppercase tracking-widest font-mono">
                    KONTROL Bride Portal • Secure Connection
                </div>
            </main>
        </div>
    );
}
