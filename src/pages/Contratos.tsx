import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSignature, Plus, Search, Loader2, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { SignatureCanvas } from "@/components/contracts/SignatureCanvas";
import { ContractDialog } from "@/components/contracts/ContractDialog";

interface Contract {
    id: string;
    title: string;
    client_id: string;
    status: 'draft' | 'sent' | 'signed';
    created_at: string;
    signed_at: string | null;
    content: string;
    signature_url: string | null;
    clients?: {
        name: string;
    };
}

interface Client {
    id: string;
    name: string;
}

export default function Contratos() {
    const { user } = useAuth();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSignOpen, setIsSignOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

    // Form State
    const [newTitle, setNewTitle] = useState("");
    const [newClient, setNewClient] = useState("");
    const [newContent, setNewContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            fetchContracts();
            fetchClients();
        }
    }, [user]);

    const fetchContracts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('contracts' as any)
            .select('*, clients(name)')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error("Erro ao carregar contratos");
        } else {
            setContracts(data as any);
        }
        setLoading(false);
    };

    const fetchClients = async () => {
        const { data } = await supabase
            .from('clients')
            .select('id, name')
            .order('name');
        if (data) setClients(data);
    };

    const handleCreate = async () => {
        if (!newTitle || !newClient || !newContent) {
            toast.error("Preencha todos os campos");
            return;
        }

        setIsSubmitting(true);
        const { error } = await supabase.from('contracts' as any).insert({
            user_id: user?.id,
            title: newTitle,
            client_id: newClient,
            content: newContent,
            status: 'draft'
        });

        if (error) {
            toast.error("Erro ao criar contrato");
        } else {
            toast.success("Contrato criado com sucesso");
            setIsCreateOpen(false);
            setNewTitle("");
            setNewClient("");
            setNewContent("");
            fetchContracts();
        }
        setIsSubmitting(false);
    };

    const handleSignatureSave = async (dataUrl: string) => {
        if (!selectedContract) return;

        // 1. Upload signature image
        const blob = await (await fetch(dataUrl)).blob();
        const fileName = `${user?.id}/${selectedContract.id}_${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
            .from('contract-signatures')
            .upload(fileName, blob);

        if (uploadError) {
            toast.error("Erro ao salvar assinatura");
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('contract-signatures')
            .getPublicUrl(fileName);

        // 2. Update contract
        const { error: updateError } = await supabase
            .from('contracts' as any)
            .update({
                status: 'signed',
                signature_url: publicUrl,
                signed_at: new Date().toISOString()
            })
            .eq('id', selectedContract.id);

        if (updateError) {
            toast.error("Erro ao atualizar contrato");
        } else {
            toast.success("Contrato assinado com sucesso!");
            setIsSignOpen(false);
            fetchContracts();
        }
    };

    const filteredContracts = (status: string) =>
        contracts.filter(c => status === 'signed' ? c.status === 'signed' : c.status !== 'signed');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl text-white">Contratos</h1>
                    <p className="text-white/60">Gerencie e colete assinaturas digitais.</p>
                </div>

                <Button
                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
                    onClick={() => setIsCreateOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Contrato
                </Button>

                <ContractDialog
                    open={isCreateOpen}
                    onOpenChange={(open) => {
                        setIsCreateOpen(open);
                        if (!open) fetchContracts(); // Refresh list on close/save
                    }}
                />
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="pending" className="data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-500">Pendentes</TabsTrigger>
                    <TabsTrigger value="signed" className="data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-500">Assinados</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                    {loading ? (
                        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-cyan-500 animate-spin" /></div>
                    ) : filteredContracts('draft').length === 0 ? (
                        <EmptyState
                            icon={FileSignature}
                            title="Nenhum contrato pendente"
                            description="Você não tem contratos aguardando assinatura."
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredContracts('draft').map(contract => (
                                <div key={contract.id} className="lumi-card p-6 space-y-4 hover:border-cyan-500/30 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-500">
                                            <FileSignature className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                            Pendente
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-medium text-white">{contract.title}</h3>
                                        <p className="text-white/50 text-sm mt-1">{contract.clients?.name}</p>
                                    </div>
                                    <div className="flex items-center text-xs text-white/40 gap-2">
                                        <Clock className="w-3 h-3" />
                                        Criado em {format(new Date(contract.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                    </div>
                                    <Dialog open={isSignOpen && selectedContract?.id === contract.id} onOpenChange={(open) => {
                                        setIsSignOpen(open);
                                        if (open) setSelectedContract(contract);
                                        else setSelectedContract(null);
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10">
                                                Coletar Assinatura
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl bg-[#1A1A1A] border-white/10">
                                            <DialogHeader>
                                                <DialogTitle>Coletar Assinatura</DialogTitle>
                                                <DialogDescription>
                                                    Peça para o cliente assinar abaixo para confirmar o contrato:
                                                    <span className="font-medium text-cyan-500 ml-1">{contract.title}</span>
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-6">
                                                <div className="p-4 bg-white/5 rounded-lg border border-white/10 max-h-[200px] overflow-y-auto text-sm text-white/80 whitespace-pre-wrap">
                                                    {contract.content}
                                                </div>
                                                <SignatureCanvas onSave={handleSignatureSave} />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="signed" className="mt-6">
                    {loading ? (
                        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-cyan-500 animate-spin" /></div>
                    ) : filteredContracts('signed').length === 0 ? (
                        <EmptyState
                            icon={CheckCircle2}
                            title="Nenhum contrato assinado"
                            description="Os contratos assinados aparecerão aqui."
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredContracts('signed').map(contract => (
                                <div key={contract.id} className="lumi-card p-6 space-y-4 opacity-75 hover:opacity-100 transition-opacity">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                                            Assinado
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-medium text-white">{contract.title}</h3>
                                        <p className="text-white/50 text-sm mt-1">{contract.clients?.name}</p>
                                    </div>
                                    <div className="flex items-center text-xs text-white/40 gap-2">
                                        <Clock className="w-3 h-3" />
                                        Assinado em {contract.signed_at && format(new Date(contract.signed_at), "dd/MM/yyyy HH:mm")}
                                    </div>
                                    {contract.signature_url && (
                                        <div className="p-2 bg-white rounded-lg mt-4">
                                            <img src={contract.signature_url} alt="Assinatura" className="h-12 object-contain mx-auto opacity-80" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
