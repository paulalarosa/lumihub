import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, MessageCircle, Clock, CheckCircle2, AlertCircle, RefreshCw, Send, Terminal } from "lucide-react";
import { differenceInDays } from "date-fns";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useMarketing } from "@/hooks/useMarketing";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketingCampaign } from "@/services/marketing";
import { useLanguage } from "@/hooks/useLanguage";

interface InactiveClient {
    id: string;
    name: string;
    phone: string | null;
    created_at: string;
    last_visit?: string | null; // Added field
    days_since_created: number;
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
    const { t } = useLanguage();
    const { width, height } = useWindowSize();
    const [clients, setClients] = useState<InactiveClient[]>([]);
    const [clientLoading, setClientLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState<InactiveClient | null>(null);
    const [selectedScriptId, setSelectedScriptId] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const { campaigns, loading: campaignsLoading } = useMarketing();

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
            // Enhanced query to check for active projects
            const { data, error: clientError } = await supabase
                .from('wedding_clients' as any)
                .select('id, name:full_name, phone, created_at, projects(status)');

            if (clientError) throw clientError;

            // Cast to bypass complex join typing
            const allClients = data as any[];

            if (clientError) throw clientError;

            const now = new Date();
            const processedClients: InactiveClient[] = [];

            for (const client of allClients || []) {
                const createdDate = new Date(client.created_at);
                const daysDiff = differenceInDays(now, createdDate);

                // Check for ANY active project
                const hasActiveProject = client.projects?.some((p: any) => p.status === 'active' || p.status === 'ongoing');

                // Logic: Created > 45 days AND NO active project
                if (daysDiff > 45 && !hasActiveProject) {
                    processedClients.push({
                        id: client.id,
                        name: client.name,
                        phone: client.phone,
                        created_at: client.created_at,
                        days_since_created: daysDiff
                    });
                }
            }

            setClients(processedClients.sort((a, b) => b.days_since_created - a.days_since_created));

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
            .replace('{days}', selectedClient.days_since_created.toString());

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/55${selectedClient.phone.replace(/\D/g, '')}?text=${encodedMessage}`;

        toast.success("Abrindo WhatsApp...");
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);

        window.open(whatsappUrl, '_blank');
        setIsDialogOpen(false);
    };

    const selectedScriptContent = displayCampaigns.find(s => s.id === selectedScriptId)?.content;

    return (
        <div className="space-y-12 animate-in fade-in duration-500 relative min-h-screen bg-black p-6 md:p-10 font-mono">
            {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={50} colors={['#ffffff', '#000000']} />}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-6">
                <div>
                    <h1 className="font-serif text-4xl text-white uppercase tracking-tighter">{t('pages.marketing.title')}</h1>
                    <p className="text-white/50 text-xs uppercase tracking-widest mt-1">
                        {t('pages.marketing.subtitle')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-black border border-white/20 rounded-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-mono uppercase tracking-widest text-white/70">OPPORTUNITIES</CardTitle>
                        <AlertCircle className="h-4 w-4 text-white" />
                    </CardHeader>
                    <CardContent>
                        {clientLoading ? (
                            <Skeleton className="h-8 w-16 bg-white/10 rounded-none" />
                        ) : (
                            <>
                                <div className="text-4xl font-serif text-white">{clients.length}</div>
                                <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1">INACTIVE_CLIENTS (+45 DAYS)</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-black border border-white/20 rounded-none col-span-1 md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-mono uppercase tracking-widest text-white flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-white" />
                            SYSTEM_LOGIC
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-white/60 space-y-2 font-mono uppercase">
                        <p>1. SCANNING_DATABASE :: IDENTIFYING ACCOUNTS INACTIVE &gt; 45 DAYS.</p>
                        <p>2. GENERATING_SCRIPT :: SELECT OPTIMIZED RE-ENGAGEMENT MESSAGE.</p>
                        <p>3. EXECUTION :: DEPLOY MESSAGE VIA WHATSAPP API.</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-black border border-white/20 rounded-none">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
                    <CardTitle className="text-white font-serif uppercase text-xl">TARGET_LIST</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchInactiveClients}
                        disabled={clientLoading}
                        className="rounded-none border-white/20 hover:bg-white hover:text-black hover:border-white text-xs uppercase tracking-widest text-white bg-black"
                    >
                        <RefreshCw className={`w-3 h-3 mr-2 ${clientLoading ? 'animate-spin' : ''}`} />
                        REFRESH_DATA
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {clientLoading ? (
                        <div className="space-y-4 p-6">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-none" />
                            ))}
                        </div>
                    ) : clients.length === 0 ? (
                        <div className="p-12">
                            <EmptyState
                                icon={CheckCircle2}
                                title="ALL_SYSTEMS_OPTIMAL"
                                description="NO_DORMANT_CLIENTS_DETECTED."
                            />
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {clients.map(client => (
                                <div key={client.id} className="flex flex-col md:flex-row items-center justify-between p-6 hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="h-10 w-10 border border-white/50 flex items-center justify-center text-white font-serif text-lg bg-black group-hover:bg-white group-hover:text-black transition-colors">
                                            {client.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold uppercase tracking-wide text-sm">{client.name}</h3>
                                            <div className="flex items-center gap-3 text-xs text-white/40 mt-1 font-mono uppercase">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    INACTIVE: {client.days_since_created} DAYS
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                        <Button
                                            onClick={() => handleOpenDialog(client)}
                                            className="w-full md:w-auto bg-white text-black hover:bg-gray-200 rounded-none border border-transparent font-mono text-xs uppercase tracking-widest"
                                            disabled={!client.phone}
                                        >
                                            <MessageCircle className="w-3 h-3 mr-2" />
                                            INITIALIZE_CONTACT
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-black border border-white/20 sm:max-w-md rounded-none">
                    <DialogHeader>
                        <DialogTitle className="text-white font-serif uppercase tracking-wide">CONFIRM_TRANSMISSION</DialogTitle>
                        <DialogDescription className="font-mono text-xs uppercase tracking-widest text-white/50">
                            TARGET: <span className="text-white font-bold">{selectedClient?.name}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-white/70">SELECT_PROTOCOL</label>
                            {campaignsLoading ? (
                                <Skeleton className="h-10 w-full bg-white/5 rounded-none" />
                            ) : (
                                <Select value={selectedScriptId} onValueChange={setSelectedScriptId}>
                                    <SelectTrigger className="bg-black border-white/20 text-white rounded-none font-mono text-xs uppercase h-12 focus:ring-0 focus:border-white">
                                        <SelectValue placeholder="SELECT_SCRIPT" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black border border-white/20 text-white rounded-none">
                                        {displayCampaigns.map(script => (
                                            <SelectItem key={script.id} value={script.id} className="font-mono text-xs uppercase focus:bg-white focus:text-black">{script.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="border border-white/50 p-4 bg-white/5 relative">
                            <h4 className="text-[10px] text-white/40 mb-2 uppercase tracking-widest font-mono border-b border-white/10 pb-1 inline-block">MESSAGE_PREVIEW</h4>
                            <p className="text-sm text-white font-mono leading-relaxed mt-2 whitespace-pre-wrap">
                                "{selectedScriptContent
                                    ?.replace('{name}', selectedClient?.name.split(' ')[0] || '')
                                    .replace('{days}', selectedClient?.days_since_created.toString() || '0')}"
                            </p>
                            <div className="absolute top-2 right-2">
                                <MessageCircle className="w-4 h-4 text-white opacity-20" />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-none border-white/20 text-white bg-black hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest">CANCEL</Button>
                        <Button onClick={handleSend} className="bg-white hover:bg-white/80 text-black rounded-none font-mono text-xs uppercase tracking-widest">
                            <Send className="w-3 h-3 mr-2" />
                            TRANSMIT
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
