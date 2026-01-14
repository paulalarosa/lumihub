import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, MessageCircle, Clock, CheckCircle2, AlertCircle, RefreshCw, Send } from "lucide-react";
import { differenceInDays } from "date-fns";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useMarketing } from "@/hooks/useMarketing";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketingCampaign } from "@/services/marketing";

interface InactiveClient {
    id: string;
    name: string;
    phone: string | null;
    last_visit: string | null;
    last_contacted_at: string | null;
    days_since_visit: number;
}

const DEFAULT_SCRIPTS: MarketingCampaign[] = [
    {
        id: 'casual',
        user_id: 'system',
        title: 'Casual (Saudades)',
        content: "Oi {name}! 💖 O Studio está com saudades. Faz {days} dias que não te vejo! Vamos renovar o visual essa semana?",
        category: 'casual',
        created_at: '',
        updated_at: ''
    },
    {
        id: 'promo',
        user_id: 'system',
        title: 'Promoção VIP',
        content: "Olá {name}, sumida! ✨ Liberei um horário VIP para você com condição especial esta semana. O que acha de agendar?",
        category: 'promo',
        created_at: '',
        updated_at: ''
    },
    {
        id: 'news',
        user_id: 'system',
        title: 'Novidades',
        content: "Oie {name}! Tudo bem? 😍 Chegaram novidades incríveis aqui no Studio e lembrei de você. Quer dar uma olhadinha?",
        category: 'news',
        created_at: '',
        updated_at: ''
    }
];

export default function Marketing() {
    const { user } = useAuth();
    const { width, height } = useWindowSize();
    const [clients, setClients] = useState<InactiveClient[]>([]);
    const [clientLoading, setClientLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState<InactiveClient | null>(null);
    const [selectedScriptId, setSelectedScriptId] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const { campaigns, loading: campaignsLoading, error: campaignsError } = useMarketing();

    // Meld default scripts with fetched campaigns if needed, or just use campaigns + fallback
    const displayCampaigns = campaigns.length > 0 ? campaigns : DEFAULT_SCRIPTS;

    useEffect(() => {
        if (displayCampaigns.length > 0 && !selectedScriptId) {
            setSelectedScriptId(displayCampaigns[0].id);
        }
    }, [displayCampaigns, selectedScriptId]);

    useEffect(() => {
        if (user) {
            fetchInactiveClients();
        }
    }, [user]);

    const fetchInactiveClients = async () => {
        setClientLoading(true);
        try {
            const { data: allClients, error: clientError } = await supabase
                .from('clients')
                .select('id, name, phone, last_visit, last_contacted_at');

            if (clientError) throw clientError;

            const now = new Date().toISOString();
            const { data: futureEvents } = await supabase
                .from('events')
                .select('client_id')
                .gte('event_date', now.split('T')[0]);

            const bookedClientIds = new Set(futureEvents?.map(e => e.client_id) || []);
            const processedClients: InactiveClient[] = [];
            const today = new Date();

            for (const client of allClients || []) {
                if (bookedClientIds.has(client.id)) continue;

                let lastVisitDate = client.last_visit ? new Date(client.last_visit) : null;

                if (!lastVisitDate) {
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
                }
            }

            setClients(processedClients.sort((a, b) => b.days_since_visit - a.days_since_visit));

        } catch (error) {
            console.error("Error fetching inactive clients:", error);
            toast.error("Erro ao carregar lista de marketing");
        } finally {
            setClientLoading(false);
        }
    };

    const handleOpenDialog = (client: InactiveClient) => {
        setSelectedClient(client);
        if (displayCampaigns.length > 0) {
            setSelectedScriptId(displayCampaigns[0].id);
        }
        setIsDialogOpen(true);
    };

    const handleSend = async () => {
        if (!selectedClient || !selectedClient.phone) return;

        const script = displayCampaigns.find(s => s.id === selectedScriptId);
        if (!script) return;

        const message = script.content
            .replace('{name}', selectedClient.name.split(' ')[0])
            .replace('{days}', selectedClient.days_since_visit.toString());

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/55${selectedClient.phone.replace(/\D/g, '')}?text=${encodedMessage}`;

        const { error } = await supabase
            .from('clients')
            .update({ last_contacted_at: new Date().toISOString() })
            .eq('id', selectedClient.id);

        if (error) {
            toast.error("Erro ao registrar contato");
        } else {
            setClients(prev => prev.map(c =>
                c.id === selectedClient.id
                    ? { ...c, last_contacted_at: new Date().toISOString() }
                    : c
            ));
            toast.success("Contato registrado!");
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
        }

        window.open(whatsappUrl, '_blank');
        setIsDialogOpen(false);
    };

    const selectedScriptContent = displayCampaigns.find(s => s.id === selectedScriptId)?.content;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative">
            {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl text-white">Recuperação de Clientes</h1>
                    <p className="text-white/60">Identifique e reconquiste clientes sumidos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-red-500/10 border-red-500/20 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-500">Risco de Perda</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        {clientLoading ? (
                            <Skeleton className="h-8 w-16 bg-white/10" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-white">{clients.length}</div>
                                <p className="text-xs text-white/50">Clientes inativos (+45 dias)</p>
                            </>
                        )}
                    </CardContent>
                </Card>

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

            <Card className="bg-[#1A1A1A]/50 border-white/10 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white font-serif">Lista de Oportunidades</CardTitle>
                    <Button variant="ghost" size="sm" onClick={fetchInactiveClients} disabled={clientLoading} className="text-white/50 hover:text-white">
                        <RefreshCw className={`w-4 h-4 mr-2 ${clientLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </CardHeader>
                <CardContent>
                    {clientLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-20 w-full bg-white/5 rounded-xl" />
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
                            {campaignsLoading ? (
                                <Skeleton className="h-10 w-full bg-white/5" />
                            ) : (
                                <Select value={selectedScriptId} onValueChange={setSelectedScriptId}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Selecione um script" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                        {displayCampaigns.map(script => (
                                            <SelectItem key={script.id} value={script.id}>{script.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative">
                            <h4 className="text-xs text-white/40 mb-2 uppercase tracking-wider font-semibold">Preview</h4>
                            <p className="text-sm text-white/90 italic">
                                "{selectedScriptContent
                                    ?.replace('{name}', selectedClient?.name.split(' ')[0] || '')
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
