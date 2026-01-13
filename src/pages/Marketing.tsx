import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Users, MessageCircle, Clock, CheckCircle2, AlertCircle, RefreshCw, Send, ArrowRight } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface InactiveClient {
    id: string;
    name: string;
    phone: string | null;
    last_visit: string | null;
    last_contacted_at: string | null;
    days_since_visit: number;
}

// Initial default scripts in case DB is empty
const DEFAULT_SCRIPTS = [
    {
        id: 'casual',
        title: 'Casual (Saudades)',
        content: "Oi {name}! 💖 O Studio está com saudades. Faz {days} dias que não te vejo! Vamos renovar o visual essa semana?"
    },
    {
        id: 'promo',
        title: 'Promoção VIP',
        content: "Olá {name}, sumida! ✨ Liberei um horário VIP para você com condição especial esta semana. O que acha de agendar?"
    },
    {
        id: 'news',
        title: 'Novidades',
        content: "Oie {name}! Tudo bem? 😍 Chegaram novidades incríveis aqui no Studio e lembrei de você. Quer dar uma olhadinha?"
    }
];

export default function Marketing() {
    const { user } = useAuth();
    const { width, height } = useWindowSize();
    const [clients, setClients] = useState<InactiveClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState<InactiveClient | null>(null);
    const [scripts, setScripts] = useState(DEFAULT_SCRIPTS);
    const [selectedScriptId, setSelectedScriptId] = useState<string>(DEFAULT_SCRIPTS[0].id);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [loadingScripts, setLoadingScripts] = useState(true);

    useEffect(() => {
        if (user) {
            fetchInactiveClients();
            fetchCampaigns();
        }
    }, [user]);

    const fetchCampaigns = async () => {
        try {
            // Simplified fetch without ordering to prevent potential indexing errors during dev
            const { data, error } = await supabase
                .from('marketing_campaigns')
                .select('*');

            if (error) throw error;

            console.log("Marketing Debug: Campaigns fetch result", { data, error });

            if (data && data.length > 0) {
                const mappedScripts = data.map(c => ({
                    id: c.id,
                    title: c.title,
                    content: c.content
                }));
                setScripts(mappedScripts);
                setSelectedScriptId(mappedScripts[0].id);
            } else {
                console.log("Marketing Debug: No campaigns found, using defaults");
                // Keep default scripts if Db is empty or return empty
                // For MVP let's keep defaults if DB is empty to show something
            }
        } catch (error) {
            console.error("Error fetching campaigns:", error);
            // Fallback to defaults is already set so we don't need to do anything, 
            // just supress the error toast to avoid annoying the user.
        } finally {
            setLoadingScripts(false);
        }
    };

    const fetchInactiveClients = async () => {
        setLoading(true);
        // 1. Get all clients matching "last_visit > 45 days ago"
        // Note: Ideally this query should be optimized on the backend or via RPC for scale.
        // For MVP, we fetch clients and filter. 
        // Better: Query events table directly for max(end_time) per client.

        // Approach A: Use 'last_visit' column on clients if it's reliably updated by triggers (it's not yet).
        // Approach B: Query events to find actual last dates.

        // Let's use Approach B for accuracy: 
        // Get all clients, then for each, find last event. 
        // OR: Get latest event for each client using distinct on.

        try {
            // Step 1: Get all clients
            const { data: allClients, error: clientError } = await supabase
                .from('clients')
                .select('id, name, phone, last_visit, last_contacted_at'); // Assuming last_visit is populated, if not we rely on events check

            if (clientError) throw clientError;

            // Step 2: Get future events to exclude clients who already booked
            const now = new Date().toISOString();
            const { data: futureEvents } = await supabase
                .from('events')
                .select('client_id')
                .gte('event_date', now.split('T')[0]); // Simple date check

            const bookedClientIds = new Set(futureEvents?.map(e => e.client_id) || []);

            // Step 3: Filter logic
            // Inactive = (No future bookings) AND (Last visit > 45 days OR No visit ever but old client?)
            // Let's stick to: Last visit > 45 days.

            const processedClients: InactiveClient[] = [];
            const today = new Date();

            for (const client of allClients || []) {
                if (bookedClientIds.has(client.id)) continue; // Has future booking, skip.

                // If last_visit is null, check events? Or assume old data?
                // Let's check events if last_visit is null, update it if possible
                let lastVisitDate = client.last_visit ? new Date(client.last_visit) : null;

                if (!lastVisitDate) {
                    // Fallback check: query last event for this client
                    const { data: lastEvent } = await supabase
                        .from('events')
                        .select('event_date')
                        .eq('client_id', client.id)
                        .lte('event_date', now)
                        .order('event_date', { ascending: false })
                        .limit(1)
                        .single();

                    if (lastEvent) {
                        lastVisitDate = new Date(lastEvent.event_date);
                    }
                }

                if (lastVisitDate) {
                    const daysDiff = differenceInDays(today, lastVisitDate);
                    if (daysDiff > 45) {
                        processedClients.push({
                            ...client,
                            last_visit: lastVisitDate.toISOString(),
                            days_since_visit: daysDiff
                        });
                    }
                } else {
                    // Client has NO history. Maybe leads?
                    // For "Win-Back", we usually mean "Back". So skip if never visited.
                }
            }

            setClients(processedClients.sort((a, b) => b.days_since_visit - a.days_since_visit));

        } catch (error) {
            console.error("Error fetching inactive clients:", error);
            toast.error("Erro ao carregar lista de marketing");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (client: InactiveClient) => {
        setSelectedClient(client);
        setIsDialogOpen(true);
    };

    const handleSend = async () => {
        if (!selectedClient || !selectedClient.phone) return;

        const script = scripts.find(s => s.id === selectedScriptId);
        if (!script) return;

        const message = script.content
            .replace('{name}', selectedClient.name.split(' ')[0])
            .replace('{days}', selectedClient.days_since_visit.toString());

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/55${selectedClient.phone.replace(/\D/g, '')}?text=${encodedMessage}`;

        // Update database (log contact)
        const { error } = await supabase
            .from('clients')
            .update({ last_contacted_at: new Date().toISOString() })
            .eq('id', selectedClient.id);

        if (error) {
            toast.error("Erro ao registrar contato");
        } else {
            // Update local state
            setClients(prev => prev.map(c =>
                c.id === selectedClient.id
                    ? { ...c, last_contacted_at: new Date().toISOString() }
                    : c
            ));
            toast.success("Contato registrado!");
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
        }

        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        setIsDialogOpen(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative">
            {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl text-white">Recuperação de Clientes</h1>
                    <p className="text-white/60">Identifique e reconquiste clientes sumidos.</p>
                </div>
            </div>

            {/* KPI Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-red-500/10 border-red-500/20 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-500">Risco de Perda</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{clients.length}</div>
                        <p className="text-xs text-white/50">Clientes inativos (+45 dias)</p>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl col-span-1 md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                            <Megaphone className="h-4 w-4 text-cyan-400" />
                            Como funciona?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-white/60 space-y-2">
                        <p>1. O sistema analisa quem não aparece há mais de 45 dias.</p>
                        <p>2. Remove da lista quem já tem agendamento futuro.</p>
                        <p>3. Sugere mensagens personalizadas para você enviar em 1 clique.</p>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            <Card className="bg-[#1A1A1A]/50 border-white/10 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white font-serif">Lista de Oportunidades</CardTitle>
                    <Button variant="ghost" size="sm" onClick={fetchInactiveClients} disabled={loading} className="text-white/50 hover:text-white">
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : clients.length === 0 ? (
                        <EmptyState
                            icon={CheckCircle2}
                            title="Tudo certo por aqui!"
                            description="Nenhum cliente em risco de churn no momento."
                        />
                    ) : (
                        <div className="space-y-4">
                            {clients.map(client => (
                                <div key={client.id} className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all gap-4">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-white font-medium border border-white/10">
                                            {client.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{client.name}</h3>
                                            <div className="flex items-center gap-3 text-sm text-white/40 mt-1">
                                                <span className="flex items-center gap-1 text-red-400">
                                                    <Clock className="w-3 h-3" />
                                                    {client.days_since_visit} dias ausente
                                                </span>
                                                {client.last_contacted_at && (
                                                    <span className="flex items-center gap-1 text-green-400">
                                                        <MessageCircle className="w-3 h-3" />
                                                        Falamos hoje
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        {client.last_contacted_at && (
                                            <span className="text-xs text-white/30 hidden md:inline">
                                                Já contactado
                                            </span>
                                        )}
                                        <Button
                                            onClick={() => handleOpenDialog(client)}
                                            className="w-full md:w-auto bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/20 transition-all"
                                            disabled={!client.phone}
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            Reativar via WhatsApp
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-[#1A1A1A] border-white/10 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white">Reativar Cliente</DialogTitle>
                        <DialogDescription>
                            Escolha uma abordagem para reconquistar <span className="text-cyan-400 font-medium">{selectedClient?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Script da Mensagem</label>
                            {loadingScripts ? (
                                <div className="h-10 bg-white/5 rounded animate-pulse" />
                            ) : (
                                <Select value={selectedScriptId} onValueChange={setSelectedScriptId}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                        {scripts.map(script => (
                                            <SelectItem key={script.id} value={script.id}>{script.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative">
                            <h4 className="text-xs text-white/40 mb-2 uppercase tracking-wider font-semibold">Preview</h4>
                            <p className="text-sm text-white/90 italic">
                                "{scripts.find(s => s.id === selectedScriptId)?.content
                                    .replace('{name}', selectedClient?.name.split(' ')[0] || '')
                                    .replace('{days}', selectedClient?.days_since_visit.toString() || '0')}"
                            </p>
                            <div className="absolute top-2 right-2">
                                <MessageCircle className="w-4 h-4 text-green-500 opacity-50" />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-white/50 hover:text-white">Cancelar</Button>
                        <Button onClick={handleSend} className="bg-green-600 hover:bg-green-700 text-white">
                            <Send className="w-4 h-4 mr-2" />
                            Enviar Mensagem
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
