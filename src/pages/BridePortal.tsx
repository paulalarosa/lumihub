import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarDays, Clock, DollarSign, Download, Lock } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BrideData {
    name: string;
    wedding_date: string | null;
}

interface Event {
    id: string;
    title: string;
    event_date: string;
    start_time: string | null;
}

export default function BridePortal() {
    const { accessToken } = useParams();
    const { toast } = useToast();

    // State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [enteredPin, setEnteredPin] = useState("");
    const [loading, setLoading] = useState(false);

    // Data
    const [bride, setBride] = useState<BrideData | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [daysLeft, setDaysLeft] = useState<number>(0);
    const [financials, setFinancials] = useState({ total: 0, paid: 0 });

    const [accessPin, setAccessPin] = useState<string | null>(null);

    // 1. Initial Load: Verify Token & Get PIN
    useEffect(() => {
        if (!accessToken) return;

        const checkToken = async () => {
            setLoading(true);
            try {
                // Fetch mapping from bride_access
                const { data: accessData, error: accessError } = await (supabase
                    .from('bride_access' as any)
                    .select('client_id, access_pin')
                    .eq('access_token', accessToken)
                    .maybeSingle()) as any;

                if (accessError || !accessData) {
                    console.error("Access Token Invalid");
                    return; // Invalid token
                }

                setAccessPin(accessData.access_pin); // Store PIN for verification

                // Check Local Storage for session
                const storedSession = localStorage.getItem(`bride_session_${accessToken}`);
                if (storedSession === "active") {
                    setIsAuthenticated(true);
                    fetchClientData(accessData.client_id);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        checkToken();
    }, [accessToken]);

    // 2. Data Fetching
    const fetchClientData = async (clientId: string) => {
        try {
            // Client
            const { data: client } = await supabase
                .from('wedding_clients')
                .select('name, wedding_date')
                .eq('id', clientId)
                .single();

            if (client) {
                setBride(client as any);
                if (client.wedding_date) {
                    const diff = differenceInDays(new Date(client.wedding_date), new Date());
                    setDaysLeft(diff > 0 ? diff : 0);
                }
            }

            // Events
            const { data: evts } = await supabase
                .from('events')
                .select('id, title, event_date, start_time')
                .eq('client_id', clientId)
                .order('event_date', { ascending: true })
                .limit(5);

            if (evts) setEvents(evts);

            // Financials
            const { data: finEvents } = await supabase
                .from('events')
                .select('total_value')
                .eq('client_id', clientId);

            if (finEvents) {
                const total = finEvents.reduce((acc, curr) => acc + (curr.total_value || 0), 0);
                setFinancials({ total, paid: 0 }); // Placeholder
            }

        } catch (e) {
            console.error("Data Load Error", e);
        }
    };

    // 3. Handle PIN Submit
    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();

        if (enteredPin === accessPin) {
            localStorage.setItem(`bride_session_${accessToken}`, "active");
            setIsAuthenticated(true);
            // Re-fetch data? We need clientId. 
            // Ideally we fetched it in step 1 but didn't store it in state, 
            // so let's refetch it or store it. 
            // For simplicity, let's just reload page or better, refetch.
            // But we need the clientId again.
            // Let's reload to be safe and hit the "storedSession" path.
            window.location.reload();
        } else {
            toast({ title: "PIN Incorreto", variant: "destructive" });
            setEnteredPin("");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
                <div className="w-full max-w-sm text-center space-y-8">
                    <div className="space-y-2">
                        <p className="text-zinc-800 tracking-[0.5em] text-[10px] font-mono uppercase">KONTROL</p>
                        <h1 className="text-3xl text-white font-serif tracking-wide uppercase">Backstage da Noiva</h1>
                    </div>

                    <form onSubmit={handleUnlock} className="space-y-6 px-8">
                        <Input
                            type="password"
                            maxLength={4}
                            value={enteredPin}
                            onChange={(e) => setEnteredPin(e.target.value)}
                            placeholder="****"
                            className="bg-transparent border-b border-zinc-800 rounded-none text-center text-3xl tracking-[1em] h-16 text-white placeholder:text-zinc-800 focus:border-white transition-colors focus:ring-0 px-0"
                            autoFocus
                        />
                        <Button
                            type="submit"
                            disabled={enteredPin.length < 4}
                            className="w-full bg-white text-black h-12 rounded-none tracking-widest text-xs uppercase hover:bg-[#e0e0e0] transition-colors"
                        >
                            Entrar
                        </Button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white selection:bg-white selection:text-black pb-20">
            {/* Header */}
            <header className="p-8 border-b border-zinc-900">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-2 font-mono">Bem-vinda</p>
                        <h1 className="text-4xl font-serif italic">
                            Olá, <span className="not-italic">{bride?.name.split(' ')[0]}</span>
                        </h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* 1. Counter */}
                <div className="lg:col-span-3 text-center py-12 border-y border-zinc-900">
                    <div className="flex items-center justify-center gap-6">
                        <span className="text-9xl font-serif leading-none">{daysLeft}</span>
                        <div className="flex flex-col items-start gap-2">
                            <span className="h-px w-12 bg-white/20"></span>
                            <span className="text-xs uppercase tracking-[0.4em] text-zinc-500 -rotate-90 origin-left translate-y-6">Dias</span>
                        </div>
                    </div>
                    <p className="mt-8 text-neutral-500 font-serif italic text-lg">Para o grande dia</p>
                </div>

                {/* 2. Agenda */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                        <h3 className="text-xl font-serif">Agenda</h3>
                        <CalendarDays className="h-4 w-4 text-zinc-600" />
                    </div>
                    <div className="space-y-4">
                        {events.length > 0 ? events.map(evt => (
                            <div key={evt.id} className="group border border-zinc-900 p-4 hover:border-white/20 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono text-zinc-500">{format(new Date(evt.event_date + 'T12:00:00'), 'dd/MM/yyyy')}</span>
                                    {evt.start_time && <span className="text-xs font-mono text-zinc-500">{evt.start_time.slice(0, 5)}</span>}
                                </div>
                                <h4 className="text-sm uppercase tracking-wide group-hover:text-zinc-300 transition-colors">{evt.title}</h4>
                            </div>
                        )) : (
                            <p className="text-xs text-zinc-600 font-mono italic">Nenhum evento próximo.</p>
                        )}
                    </div>
                </div>

                {/* 3. Financial */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                        <h3 className="text-xl font-serif">Financeiro</h3>
                        <DollarSign className="h-4 w-4 text-zinc-600" />
                    </div>
                    <div className="border border-zinc-900 p-6 space-y-6">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Total Contrato</p>
                            <p className="text-xl font-mono">{financials.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Status</p>
                            <div className="w-full bg-zinc-900 h-1 mt-2">
                                <div className="bg-white h-full w-[10%]"></div>
                            </div>
                            <p className="text-right text-[10px] text-zinc-600 mt-1">10% Pago</p>
                        </div>
                    </div>
                </div>

                {/* 4. Docs */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                        <h3 className="text-xl font-serif">Contrato</h3>
                        <Lock className="h-4 w-4 text-zinc-600" />
                    </div>
                    <Button variant="outline" className="w-full h-16 rounded-none border border-zinc-900 hover:bg-white hover:text-black hover:border-white transition-all group justify-between px-6">
                        <span className="uppercase tracking-widest text-xs">Baixar PDF</span>
                        <Download className="h-4 w-4 text-zinc-500 group-hover:text-black" />
                    </Button>
                </div>
            </main>
        </div>
    )
}
