import { ActionButton } from "@/components/ui/action-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Kept for 'Ver Detalhes'
import { Search, Plus, Filter, FileText, CheckCircle2, Calendar, PenTool } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/components/ui/status-badge";
import { ContractDocument } from "@/features/contracts/components/ContractDocument";
import { ContractDialog } from "@/components/contracts/ContractDialog";
import { SignatureModal } from "@/components/contracts/SignatureModal";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useContracts } from "@/features/contracts/hooks/useContracts";

export default function Contratos() {
    const {
        filteredContracts,
        loading,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        isDialogOpen,
        setIsDialogOpen,
        signatureOpen,
        setSignatureOpen,
        selectedContract,
        setSelectedContract,
        handleSignatureSave
    } = useContracts();

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl text-white">Contratos & Documentos</h1>
                    <p className="text-white/60">Gerencie contratos, orçamentos e assinaturas digitais.</p>
                </div>
                <ActionButton onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Contrato
                </ActionButton>
            </div>

            {/* Main Creation Dialog */}
            <ContractDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-black p-4 border border-white/20">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                        placeholder="BUSCAR CONTRATO..."
                        className="pl-10 bg-transparent border-white/20 text-white placeholder:text-white/30 rounded-none focus:border-white font-mono text-xs uppercase"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Filter className="w-4 h-4 text-white/50" />
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${statusFilter === 'all' ? 'bg-white text-black font-bold' : 'text-white/60 hover:text-white border border-white/10'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setStatusFilter('draft')}
                        className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${statusFilter === 'draft' ? 'bg-white text-black font-bold' : 'text-white/60 hover:text-white border border-white/10'}`}
                    >
                        Rascunhos
                    </button>
                    <button
                        onClick={() => setStatusFilter('sent')}
                        className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${statusFilter === 'sent' ? 'bg-white text-black font-bold' : 'text-white/60 hover:text-white border border-white/10'}`}
                    >
                        Enviados
                    </button>
                    <button
                        onClick={() => setStatusFilter('signed')}
                        className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${statusFilter === 'signed' ? 'bg-white text-black font-bold' : 'text-white/60 hover:text-white border border-white/10'}`}
                    >
                        Assinados
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-white/40 font-mono uppercase text-xs">Carregando seus documentos...</div>
                ) : filteredContracts.length === 0 ? (
                    <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-lg">
                        <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-white font-serif text-lg">Nenhum contrato encontrado</h3>
                        <p className="text-white/40 text-sm mt-2">Crie um novo contrato para começar.</p>
                    </div>
                ) : (
                    filteredContracts.map(contract => (
                        <Card key={contract.id} className="bg-white/5 border-white/10 backdrop-blur-sm group hover:border-[#00e5ff]/50 transition-all duration-300">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-white font-medium text-lg leading-tight group-hover:text-[#00e5ff] transition-colors">
                                            {contract.title}
                                        </CardTitle>
                                        <p className="text-white/50 text-xs uppercase tracking-wider font-mono">
                                            {contract.clients?.name}
                                        </p>
                                    </div>
                                    <StatusBadge
                                        label={contract.status === 'signed' ? 'Assinado' : contract.status === 'sent' ? 'Enviado' : 'Rascunho'}
                                        color={contract.status === 'signed' ? 'success' : contract.status === 'sent' ? 'info' : 'neutral'}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4 text-xs text-white/40 font-mono">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(contract.created_at), "dd/MM/yyyy")}
                                    </div>
                                    {contract.signed_at && (
                                        <div className="flex items-center gap-1.5 text-green-500/70">
                                            <CheckCircle2 className="w-3 h-3" />
                                            {format(new Date(contract.signed_at), "dd/MM")}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    {/* Preview / Edit Action */}
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 h-8 text-xs uppercase tracking-wider font-bold">
                                                Ver Detalhes
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl h-[80vh] bg-[#1A1A1A] border-white/10 text-white overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>{contract.title}</DialogTitle>
                                            </DialogHeader>
                                            <div className="mt-4 space-y-4">
                                                <div className="bg-white text-black p-8 rounded-sm min-h-[500px] shadow-xl font-serif text-sm leading-relaxed whitespace-pre-wrap">
                                                    <h2 className="text-center text-xl font-bold mb-8 uppercase tracking-widest border-b-2 border-black pb-4">
                                                        Contrato de Prestação de Serviços
                                                    </h2>
                                                    {contract.content}

                                                    <div className="mt-12 grid grid-cols-2 gap-12 pt-8">
                                                        {contract.signature_url ? (
                                                            <div className="text-center">
                                                                <img
                                                                    src={contract.signature_url}
                                                                    alt="Assinatura"
                                                                    className="h-16 mx-auto mb-2 mix-blend-multiply"
                                                                />
                                                                <div className="border-t border-black pt-2 font-bold uppercase text-xs">
                                                                    {contract.clients?.name}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 mt-1">
                                                                    Assinado digitalmente em {format(new Date(contract.signed_at || ''), "dd/MM/yyyy HH:mm")}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center opacity-30">
                                                                <div className="h-16 mb-2 border-b border-black"></div>
                                                                <div className="font-bold uppercase text-xs">{contract.clients?.name}</div>
                                                                <div className="text-[10px] mt-1">(Aguardando Assinatura)</div>
                                                            </div>
                                                        )}

                                                        <div className="text-center">
                                                            <div className="h-16 mb-2 flex items-end justify-center">
                                                                <div className="font-script text-2xl">Lumia Agency</div>
                                                            </div>
                                                            <div className="border-t border-black pt-2 font-bold uppercase text-xs">
                                                                CONTRATADA
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                                    <PDFDownloadLink
                                                        document={<ContractDocument contract={contract} />}
                                                        fileName={`contrato-${contract.title.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                                                    >
                                                        {({ loading: pdfLoading }) => (
                                                            <Button variant="outline" disabled={pdfLoading} className="border-white/10 text-white hover:bg-white/10">
                                                                {pdfLoading ? 'Gerando PDF...' : 'Baixar PDF'}
                                                            </Button>
                                                        )}
                                                    </PDFDownloadLink>

                                                    {contract.status !== 'signed' && (
                                                        <ActionButton onClick={() => {
                                                            setSelectedContract(contract);
                                                            setSignatureOpen(true);
                                                        }}>
                                                            <PenTool className="w-4 h-4 mr-2" />
                                                            Coletar Assinatura Agora
                                                        </ActionButton>
                                                    )}
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    {/* Quick Actions */}
                                    {contract.status === 'signed' ? (
                                        <PDFDownloadLink
                                            document={<ContractDocument contract={contract} />}
                                            fileName={`contrato-${contract.title.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                                        >
                                            {({ loading: pdfLoading }) => (
                                                <ActionButton fullWidth className="h-8" disabled={pdfLoading}>
                                                    {pdfLoading ? '...' : 'Baixar PDF'}
                                                </ActionButton>
                                            )}
                                        </PDFDownloadLink>
                                    ) : (
                                        <ActionButton
                                            fullWidth
                                            className="h-8"
                                            onClick={() => {
                                                setSelectedContract(contract);
                                                setSignatureOpen(true);
                                            }}
                                        >
                                            Assinar
                                        </ActionButton>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Signature Dialog */}
            <SignatureModal
                isOpen={signatureOpen}
                onClose={() => setSignatureOpen(false)}
                onConfirm={handleSignatureSave}
            />
        </div>
    );
}
