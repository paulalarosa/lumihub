import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Instagram,
    Calendar,
    FileText,
    Clock,
    Trash2,
    Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RecordDialog } from '@/components/clients/RecordDialog';
import { motion } from 'framer-motion';
import { ClientService } from '@/services/clientService';

interface Client {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    instagram: string | null;
    notes: string | null;
    tags: string[] | null;
    created_at: string;
}

interface TreatmentRecord {
    id: string;
    date: string;
    service_name: string;
    notes: string | null;
    photos: string[] | null;
    created_at: string;
}

export default function ClientDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [client, setClient] = useState<Client | null>(null);
    const [records, setRecords] = useState<TreatmentRecord[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/auth');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user && id) {
            fetchData();
        }
    }, [user, id]);

    const fetchData = async () => {
        if (!id) return;
        setLoadingData(true);

        // Fetch client
        const { data: clientData, error: clientError } = await ClientService.get(id);

        if (clientError || !clientData) {
            toast({ title: "Cliente não encontrado", variant: "destructive" });
            navigate('/clientes');
            return;
        }

        setClient(clientData as Client);

        // Fetch records - getTreatmentRecords returns empty array now
        const recordsData = await ClientService.getTreatmentRecords(id);
        setRecords(recordsData || []);

        setLoadingData(false);
    };

    const deleteRecord = async (recordId: string) => {
        if (!confirm('Tem certeza que deseja excluir este registro?')) return;
        
        await ClientService.deleteTreatmentRecord(recordId);
        toast({ title: "Registro excluído" });
        fetchData();
    };

    if (authLoading || loadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00e5ff]"></div>
            </div>
        );
    }

    if (!client) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-[#C0C0C0]">
            {/* Header with Glassmorphism */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link to="/clientes">
                                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/5">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00e5ff]/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                                    <User className="h-5 w-5 text-[#00e5ff]" />
                                </div>
                                <div>
                                    <h1 className="font-serif text-xl text-white tracking-wide">
                                        {client.name}
                                    </h1>
                                    <p className="text-xs text-white/40 uppercase tracking-wider">Perfil da Cliente</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons could go here */}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 pt-28 pb-12">
                <Tabs defaultValue="historico" className="space-y-8">
                    <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl w-full max-w-md mx-auto grid grid-cols-2 gap-2">
                        <TabsTrigger
                            value="dados"
                            className="data-[state=active]:bg-[#00e5ff] data-[state=active]:text-black text-white/60 font-medium rounded-lg transition-all"
                        >
                            Dados Pessoais
                        </TabsTrigger>
                        <TabsTrigger
                            value="historico"
                            className="data-[state=active]:bg-[#00e5ff] data-[state=active]:text-black text-white/60 font-medium rounded-lg transition-all"
                        >
                            Histórico / Prontuário
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dados" className="max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <Card className="bg-[#1A1A1A]/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                                <Mail className="h-5 w-5 text-[#00e5ff]" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white/40 uppercase tracking-widest font-light mb-1">Email</p>
                                                <p className="text-white font-light">{client.email || 'Não informado'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                                <Phone className="h-5 w-5 text-[#00e5ff]" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white/40 uppercase tracking-widest font-light mb-1">Telefone</p>
                                                <p className="text-white font-light">{client.phone || 'Não informado'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                                <Instagram className="h-5 w-5 text-[#00e5ff]" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white/40 uppercase tracking-widest font-light mb-1">Instagram</p>
                                                <p className="text-white font-light">{client.instagram || 'Não informado'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                                <Calendar className="h-5 w-5 text-[#00e5ff]" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white/40 uppercase tracking-widest font-light mb-1">Cliente Desde</p>
                                                <p className="text-white font-light">
                                                    {format(new Date(client.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>

                                        {client.notes && (
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                                    <FileText className="h-5 w-5 text-[#00e5ff]" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-white/40 uppercase tracking-widest font-light mb-1">Observações</p>
                                                    <p className="text-white/80 font-light text-sm leading-relaxed whitespace-pre-wrap">
                                                        {client.notes}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="historico" className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-serif text-white">Prontuário Estético</h2>
                                <p className="text-white/40 font-light">Linha do tempo de tratamentos e evoluções</p>
                            </div>
                            <RecordDialog clientId={client.id} onRecordAdded={fetchData} />
                        </div>

                        <div className="space-y-8 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-[1px] before:bg-gradient-to-b before:from-[#00e5ff]/50 before:via-white/10 before:to-transparent">
                            {records.length === 0 ? (
                                <div className="ml-20 py-12 text-center border border-white/10 rounded-2xl bg-white/5 border-dashed">
                                    <Sparkles className="h-10 w-10 text-white/20 mx-auto mb-4" />
                                    <p className="text-white/40">Nenhum registro encontrado.</p>
                                    <p className="text-white/20 text-sm">Adicione o primeiro tratamento para começar a história.</p>
                                </div>
                            ) : (
                                records.map((record, index) => (
                                    <motion.div
                                        key={record.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="relative pl-20 group"
                                    >
                                        {/* Timeline Node */}
                                        <div className="absolute left-6 top-6 w-4 h-4 rounded-full bg-[#050505] border-2 border-[#00e5ff] z-10 group-hover:scale-125 transition-transform duration-300 shadow-[0_0_10px_rgba(0,229,255,0.4)]" />

                                        <Card className="bg-[#1A1A1A]/60 backdrop-blur-xl border border-white/5 hover:border-[#00e5ff]/30 transition-all duration-300 overflow-hidden group-hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                            <div className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant="outline" className="border-[#00e5ff]/30 text-[#00e5ff] bg-[#00e5ff]/5">
                                                                {record.service_name}
                                                            </Badge>
                                                            <span className="text-white/30 text-xs flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {format(new Date(record.created_at), "HH:mm")}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg font-medium text-white">
                                                            {format(new Date(record.date), "d 'de' MMMM, yyyy", { locale: ptBR })}
                                                        </h3>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-white/20 hover:text-red-400 hover:bg-white/5 -mr-2"
                                                        onClick={() => deleteRecord(record.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {record.notes && (
                                                    <p className="text-white/70 font-light text-sm leading-relaxed mb-6 bg-black/20 p-4 rounded-lg border border-white/5">
                                                        {record.notes}
                                                    </p>
                                                )}

                                                {record.photos && record.photos.length > 0 && (
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                        {record.photos.map((photo, i) => (
                                                            <div key={i} className="aspect-square rounded-lg overflow-hidden border border-white/10 relative group/photo">
                                                                <img
                                                                    src={photo}
                                                                    alt="Tratamento"
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-110"
                                                                />
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <a href={photo} target="_blank" rel="noopener noreferrer" className="text-white text-xs font-medium hover:underline">
                                                                        Ver Ampliado
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
