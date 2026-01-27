import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSignature, Plus, Search, Loader2, CheckCircle2, Clock, Terminal } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { SignatureCanvas } from "@/components/contracts/SignatureCanvas";

import { ContractDialog } from "@/components/contracts/ContractDialog";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ContractDocument } from "@/features/contracts/components/ContractDocument";

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
    const [error, setError] = useState<string | null>(null);

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
        setError(null);
        try {
            // 1. Fetch Contracts First (No Joins)
            const { data: contractsData, error: apiError } = await supabase
                .from('contracts')
                .select(`
                    id, 
                    title, 
                    client_id, 
                    status, 
                    created_at, 
                    signed_at, 
                    content, 
                    signature_url
                `)
                .order('created_at', { ascending: false });

            if (apiError) throw apiError;

            // 2. Manually Fetch Clients for these contracts
            const clientIds = (contractsData || [])
                .map((c: any) => c.client_id)
                .filter(Boolean);

            let clientsMap: Record<string, any> = {};

            if (clientIds.length > 0) {
                // Trying wedding_clients first as per physical schema
                const { data: clientsData } = await supabase
                    .from('wedding_clients')
                    .select('id, name:full_name')
                    .in('id', clientIds);

                if (clientsData) {
                    clientsData.forEach((c: any) => {
                        clientsMap[c.id] = c;
                    });
                }
            }

            // 3. Merge Data
            const safeContracts = (contractsData || []).map((item: any) => ({
                ...item,
                clients: clientsMap[item.client_id] || { name: 'Cliente Desconhecido' }
            })) as Contract[];

            setContracts(safeContracts);
        } catch (err: any) {
            console.error('Error fetching contracts:', err);
            setError(err.message || "Falha ao carregar contratos");
            toast.error("Erro ao carregar sistema de contratos");
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        const { data } = await supabase
            .from('wedding_clients')
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
        const { error } = await supabase.from('contracts').insert({
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
            .from('contracts')
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
        <div className="space-y-12 animate-in fade-in duration-500 bg-black min-h-screen p-6 md:p-10 font-mono text-white selection:bg-white selection:text-black">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-6">
                <div>
                    <h1 className="font-serif text-4xl text-white uppercase tracking-tighter">LEGAL // CONTRACTS</h1>
                    <p className="text-white/50 text-xs uppercase tracking-widest mt-1">DIGITAL_SIGNATURE_MANAGEMENT_SYSTEM.</p>
                </div>

                <Button
                    className="rounded-none bg-white text-black hover:bg-white/80 hover:text-black font-mono uppercase tracking-widest text-xs h-10 px-6"
                    onClick={() => setIsCreateOpen(true)}
                >
                    <Plus className="w-3 h-3 mr-2" />
                    CREATE_DOCUMENT
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
                <TabsList className="bg-black border border-white/20 p-0 h-auto rounded-none w-full sm:w-auto flex flex-col sm:flex-row">
                    <TabsTrigger
                        value="pending"
                        className="rounded-none data-[state=active]:bg-white data-[state=active]:text-black text-white/50 font-mono uppercase text-xs tracking-widest h-10 px-6 w-full sm:w-auto border-r border-transparent sm:border-white/20 last:border-0 data-[state=active]:border-transparent transition-all"
                    >
                        PENDING_APPROVAL
                    </TabsTrigger>
                    <TabsTrigger
                        value="signed"
                        className="rounded-none data-[state=active]:bg-white data-[state=active]:text-black text-white/50 font-mono uppercase text-xs tracking-widest h-10 px-6 w-full sm:w-auto transition-all"
                    >
                        EXECUTED_CONTRACTS
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <p className="font-mono text-xs uppercase tracking-widest text-white/50 animate-pulse">
                                Scanning Database...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="border border-red-900/50 bg-red-900/10 p-12 text-center">
                            <Terminal className="w-8 h-8 text-red-500 mx-auto mb-4" />
                            <h3 className="text-white font-serif uppercase tracking-wider mb-1">SYSTEM_ERROR</h3>
                            <p className="text-red-400 text-xs font-mono uppercase">{error}</p>
                            <Button
                                onClick={fetchContracts}
                                variant="outline"
                                className="mt-6 rounded-none border-red-500 text-red-500 hover:bg-red-950 font-mono uppercase text-xs"
                            >
                                RETRY_CONNECTION
                            </Button>
                        </div>
                    ) : filteredContracts('draft').length === 0 ? (
                        <div className="border border-white/10 bg-white/5 p-12 text-center">
                            <CheckCircle2 className="w-8 h-8 text-white/20 mx-auto mb-4" />
                            <h3 className="text-white font-serif uppercase tracking-wider mb-1">NO_PENDING_DOCUMENTS</h3>
                            <p className="text-white/40 text-xs font-mono uppercase tracking-widest">ALL_CONTRACTS_PROCESSED.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredContracts('draft').map(contract => (
                                <div key={contract.id} className="group bg-black border border-white/20 p-6 hover:border-white transition-all duration-300 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                                        <FileSignature className="w-12 h-12 text-white" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 border border-white/20 group-hover:bg-white group-hover:text-black transition-colors">
                                            <FileSignature className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 border border-white/20 px-2 py-1">
                                            STATUS: PENDING
                                        </span>
                                    </div>
                                    <div className="mb-6 relative z-10">
                                        <h3 className="text-xl font-serif text-white uppercase tracking-tight">{contract.title}</h3>
                                        <p className="text-white/50 text-xs font-mono uppercase mt-1 tracking-wider">CLIENT: {contract.clients?.name}</p>
                                    </div>
                                    <div className="flex items-center text-[10px] text-white/40 gap-2 font-mono uppercase border-t border-white/10 pt-4">
                                        <Clock className="w-3 h-3" />
                                        CREATED: {format(new Date(contract.created_at), "dd MMM yyyy", { locale: ptBR })}
                                    </div>
                                    <Dialog open={isSignOpen && selectedContract?.id === contract.id} onOpenChange={(open) => {
                                        setIsSignOpen(open);
                                        if (open) setSelectedContract(contract);
                                        else setSelectedContract(null);
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full mt-4 rounded-none bg-white text-black hover:bg-gray-200 border border-transparent text-xs font-mono uppercase tracking-widest">
                                                SIGNATURE_REQUIRED
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl bg-black border border-white/20 rounded-none p-0">
                                            <DialogHeader className="p-6 border-b border-white/20">
                                                <DialogTitle className="font-serif text-2xl uppercase text-white">EXECUTE_CONTRACT</DialogTitle>
                                                <DialogDescription className="font-mono text-xs uppercase text-white/50 tracking-widest">
                                                    CONFIRMING_AGREEMENT: <span className="text-white font-bold decoration-white decoration-1 underline-offset-4 underline">{contract.title}</span>
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-6 p-6">
                                                <div className="p-4 bg-white/5 border border-white/10 max-h-[300px] overflow-y-auto text-sm text-white/70 font-mono whitespace-pre-wrap custom-scrollbar">
                                                    {contract.content}
                                                </div>
                                                <div className="border-t border-white/10 pt-6">
                                                    <h4 className="font-mono text-xs uppercase text-white/50 mb-4 tracking-widest">SIGNATURE_INPUT_FIELD</h4>
                                                    <SignatureCanvas onSave={handleSignatureSave} />
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="signed" className="mt-8">
                    {loading ? (
                        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>
                    ) : filteredContracts('signed').length === 0 ? (
                        <div className="border border-dashed border-white/20 p-12 text-center">
                            <CheckCircle2 className="w-8 h-8 text-white/20 mx-auto mb-4" />
                            <h3 className="text-white font-serif uppercase tracking-wider mb-1">NO_EXECUTED_CONTRACTS</h3>
                            <p className="text-white/40 text-xs font-mono uppercase">ARCHIVE_EMPTY.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredContracts('signed').map(contract => (
                                <div key={contract.id} className="group bg-black border border-white/20 p-6 hover:border-white transition-all duration-300 opacity-60 hover:opacity-100">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 border border-white/20 group-hover:bg-white group-hover:text-black transition-colors">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 border border-white/20 px-2 py-1 bg-white/5">
                                            STATUS: SIGNED
                                        </span>
                                    </div>
                                    <div className="mb-4">
                                        <h3 className="text-xl font-serif text-white uppercase tracking-tight">{contract.title}</h3>
                                        <p className="text-white/50 text-xs font-mono uppercase mt-1 tracking-wider">CLIENT: {contract.clients?.name}</p>
                                    </div>
                                    <div className="flex items-center text-[10px] text-white/40 gap-2 font-mono uppercase border-t border-white/10 pt-4">
                                        <Clock className="w-3 h-3" />
                                        SIGNED: {contract.signed_at && format(new Date(contract.signed_at), "dd/MM/yyyy HH:mm")}
                                    </div>
                                    {contract.signature_url && (
                                        <div className="p-2 border border-white/10 bg-white/5 mt-4 grayscale hover:grayscale-0 transition-all">
                                            <img src={contract.signature_url} alt="Assinatura" className="h-12 object-contain mx-auto opacity-70 hover:opacity-100 invert" />
                                        </div>
                                    )}

                                    <div className="mt-6 border-t border-white/10 pt-4">
                                        <PDFDownloadLink
                                            document={
                                                <ContractDocument
                                                    contract={{
                                                        id: contract.id,
                                                        clientName: contract.clients?.name || "Client Name",
                                                        totalValue: 0, // Placeholder as per schema limitation
                                                        eventDate: new Date().toLocaleDateString('pt-BR'), // Placeholder
                                                        servicesList: ["Makeup Services", "Hair Styling"], // Placeholder
                                                        terms: contract.content,
                                                        created_at: contract.created_at
                                                    }}
                                                />
                                            }
                                            fileName={`contract_${contract.id.slice(0, 8)}.pdf`}
                                        >
                                            {({ blob, url, loading, error }) => (
                                                <Button
                                                    disabled={loading}
                                                    className="w-full rounded-none bg-white text-black hover:bg-white/90 border border-transparent text-[10px] font-mono uppercase tracking-widest h-8"
                                                >
                                                    {loading ? "GERANDO DOCUMENTO..." : "BAIXAR PDF (OFICIAL)"}
                                                </Button>
                                            )}
                                        </PDFDownloadLink>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
