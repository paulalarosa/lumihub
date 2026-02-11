import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, ExternalLink, FileText, Sparkles, MessageCircle, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { ProjectService as ProjectServiceAPI } from '@/services/projectService';
import type { Contract, ProjectWithRelations, ProjectServiceItem, Profile } from '@/types/api.types';

import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ContratosTabProps {
    projectId: string;
    contracts: Contract[];
    setContracts: (contracts: Contract[]) => void;
    loading?: boolean;
    project: ProjectWithRelations;
    projectServices: ProjectServiceItem[];
    totalValue: number;
}

export function ContratosTab({ projectId, contracts, setContracts, loading, project, projectServices, totalValue }: ContratosTabProps) {
    const { organizationId } = useOrganization();
    const { user } = useAuth();
    const { toast } = useToast();
    const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
    const [contractTitle, setContractTitle] = useState('');
    const [contractContent, setContractContent] = useState('');

    const [loadingAI, setLoadingAI] = useState(false);
    const [loadingEdit, setLoadingEdit] = useState(false);
    const [aiCommand, setAiCommand] = useState('');
    const [contractor, setContractor] = useState<Profile | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setContractor(data);
        };
        fetchProfile();
    }, [user]);


    useEffect(() => {
        const fetchContracts = async () => {
            if (!projectId) return;
            const { data } = await supabase
                .from('contracts')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (data) {
                setContracts(data);
            }
        };
        fetchContracts();
    }, [projectId]);

    const handleSaveContract = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId || !organizationId) return;

        const { error } = await ProjectServiceAPI.createContract({
            project_id: projectId,
            user_id: organizationId,
            title: contractTitle.trim(),
            content: contractContent.trim(),
            status: 'draft'
        });

        if (error) {
            toast({ title: "Erro ao criar contrato", variant: "destructive" });
        } else {
            toast({ title: "Contrato criado!" });
            setIsContractDialogOpen(false);
            setContractTitle('');
            setContractContent('');
            const { data } = await ProjectServiceAPI.getContracts(projectId);
            setContracts(data || []);
        }
    };

    const handleExportPDF = () => {
        if (!contractTitle || !contractContent) {
            toast({ title: "Preencha o contrato primeiro", variant: "destructive" });
            return;
        }
        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.text(contractTitle.toUpperCase(), 20, 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        const splitText = doc.splitTextToSize(contractContent, 170);
        doc.text(splitText, 20, 40);

        doc.save(`${contractTitle}.pdf`);
    };

    const shareOnWhatsApp = () => {
        const phone = project?.client?.phone;
        if (!phone) {
            toast({ title: "Cliente sem telefone cadastrado", variant: "destructive" });
            return;
        }
        const text = `Olá! Segue o link do contrato: ${window.location.href}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleArchitectMode = async () => {
        if (!project || !user) return;

        // Safety Check:
        if (!project?.client) {
            toast({ variant: "destructive", title: "Erro", description: "Dados do cliente não carregaram. Recarregue a página." });
            return;
        }

        setLoadingAI(true);
        setContractContent("");

        try {
            // 1. Fetch Contractor (Artist) Data
            const { data: userProfileRaw } = await supabase
                .from('profiles')
                .select('full_name, document_id, address, city, state')
                .eq('id', user.id)
                .single();

            const userProfile = userProfileRaw;

            const servicesList = projectServices.map(s => s.service?.name || 'Serviço').join(', ') || 'Serviços Gerais';
            const totalValueFormatted = totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            const context = {
                contractor: {
                    name: userProfile?.full_name || "NOME DA MAQUIADORA",
                    doc: userProfile?.document_id || "CPF/CNPJ",
                    address: `${userProfile?.city || 'Cidade'} - ${userProfile?.state || 'UF'}`
                },
                client: {
                    name: project.client.full_name || 'Cliente',
                    doc: project.client?.cpf || "_______________",
                    address: project.client?.address || "_______________"
                },
                event: {
                    date: project.event_date ? new Date(project.event_date).toLocaleDateString('pt-BR') : 'Data a definir',
                    location: project.event_location || "Local a definir",
                    services: servicesList,
                    total: totalValueFormatted
                },
                mode: 'creation' // Architect Mode
            };

            const { data, error } = await supabase.functions.invoke('generate-contract-ai', {
                body: context
            });

            if (error) throw error;
            if (data?.text) {
                setContractContent(data.text);
                toast({ title: "Contrato Completo Gerado!", description: "Estrutura criada com sucesso." });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro na IA", description: "Falha ao gerar o contrato." });
        } finally {
            setLoadingAI(false);
        }
    };

    const handleEditorMode = async () => {
        if (!contractContent) return;
        setLoadingEdit(true);

        try {
            const { data, error } = await supabase.functions.invoke('generate-contract-ai', {
                body: {
                    action: 'EDIT',
                    currentText: contractContent,
                    command: aiCommand
                }
            });

            if (error) throw error;
            if (data?.text) {
                setContractContent(data.text);
                setAiCommand('');
                toast({ title: "Contrato Refinado!", description: "Alterações aplicadas com sucesso." });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro na IA", description: "Falha ao editar o contrato." });
        } finally {
            setLoadingEdit(false);
        }
    };

    return (
        <Card className="bg-black border border-white/20 rounded-none">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
                <div>
                    <CardTitle className="text-white font-serif uppercase tracking-wide">LEGAL_DOCS</CardTitle>
                    <CardDescription className="text-white/40 font-mono text-xs uppercase tracking-widest">CONTRACTS & AGREEMENTS</CardDescription>
                </div>
                <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest">
                            <Plus className="h-3 w-3 mr-2" />
                            NEW_CONTRACT
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl bg-black border border-white/20 rounded-none h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="text-white font-serif uppercase tracking-wide">LEGAL_DOCS_AI</DialogTitle>
                            <DialogDescription className="text-white/40 font-mono text-xs uppercase tracking-widest">
                                Use a Inteligência Artificial para criar ou refinar seus contratos.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                            <form onSubmit={handleSaveContract} className="space-y-4 border-b border-white/10 pb-6">
                                <div className="space-y-2">
                                    <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">TÍTULO DO DOCUMENTO</Label>
                                    <Input
                                        value={contractTitle}
                                        onChange={(e) => setContractTitle(e.target.value)}
                                        placeholder="EX: CONTRATO DE PRESTAÇÃO DE SERVIÇOS"
                                        className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">CONTEÚDO (MARKDOWN/TEXTO)</Label>
                                    <Textarea
                                        value={contractContent}
                                        onChange={(e) => setContractContent(e.target.value)}
                                        placeholder="O conteúdo será gerado aqui..."
                                        rows={12}
                                        className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white text-sm leading-relaxed"
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={!contractContent} className="w-full bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest">
                                    SALVAR CONTRATO
                                </Button>
                            </form>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                                {/* SECTION A: CRIAR DO ZERO */}
                                <div className="space-y-3 p-4 border border-white/10 bg-white/5">
                                    <div className="flex items-center gap-2 text-white">
                                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                                        <span className="font-serif uppercase tracking-wide text-sm">CRIAR DO ZERO</span>
                                    </div>
                                    <p className="text-[10px] text-white/50 font-mono leading-tight">
                                        Gera um contrato completo de ~10 cláusulas baseado nos dados do projeto.
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={handleArchitectMode}
                                        disabled={loadingAI || !contractor}
                                        variant="outline"
                                        className="w-full border-white/20 text-white hover:bg-[#D4AF37] hover:text-black hover:border-transparent rounded-none font-mono text-[10px] uppercase tracking-widest h-auto py-3 whitespace-normal text-center"
                                    >
                                        {loadingAI ? 'GERANDO...' : 'GERAR ESTRUTURA COMPLETA (LEGAL ARCHITECT)'}
                                    </Button>
                                    {!contractor && (
                                        <p className="text-[9px] text-red-400 font-mono mt-1 text-center">
                                            ⚠️ Perfil incompleto (CPF/Endereço)
                                        </p>
                                    )}
                                </div>

                                {/* SECTION B: REFINAR */}
                                <div className="space-y-3 p-4 border border-white/10 bg-white/5">
                                    <div className="flex items-center gap-2 text-white justify-between">
                                        <div className="flex items-center gap-2">
                                            <MessageCircle className="w-4 h-4 text-white" />
                                            <span className="font-serif uppercase tracking-wide text-sm">REFINAR / EDITAR</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={handleExportPDF} title="Baixar PDF">
                                                <FileText className="h-3 w-3 text-white/70" />
                                            </Button>
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={shareOnWhatsApp} title="Enviar WhatsApp">
                                                <MessageCircle className="h-3 w-3 text-white/70" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-white/50 font-mono leading-tight">
                                        Ajusta cláusulas específicas mantendo a estrutura original.
                                    </p>
                                    <div className="flex gap-2">
                                        <Input
                                            value={aiCommand}
                                            onChange={(e) => setAiCommand(e.target.value)}
                                            placeholder="Ex: Altere a multa para 20%..."
                                            className="bg-black border-white/20 rounded-none text-white font-mono text-[10px] h-8"
                                            onKeyDown={(e) => e.key === 'Enter' && handleEditorMode()}
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleEditorMode}
                                            disabled={loadingEdit || !contractContent || !aiCommand.trim()}
                                            variant="secondary"
                                            className="rounded-none font-mono text-[10px] uppercase tracking-widest h-8"
                                        >
                                            {loadingEdit ? '...' : 'APLICAR'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="p-6">
                {contracts.length === 0 ? (
                    <p className="text-white/20 text-center py-8 font-mono uppercase text-xs tracking-widest border border-white/10 border-dashed">
                        NO_DOCUMENTS_FILED
                    </p>
                ) : (
                    <div className="space-y-3">
                        {contracts.map((contract) => (
                            <div
                                key={contract.id}
                                className="flex items-center justify-between p-4 border border-white/10 bg-white/5 hover:border-white/30 transition-colors"
                            >
                                <div>
                                    <p className="font-serif text-white uppercase tracking-wide text-sm mb-1">{contract.title}</p>
                                    <Badge variant="outline" className={`rounded-none font-mono text-[9px] uppercase tracking-widest border-white/20 text-white/50`}>
                                        STATUS: {contract.status}
                                    </Badge>
                                </div>
                                <Button variant="outline" size="sm" className="rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase">
                                    <ExternalLink className="h-3 w-3 mr-2" />
                                    VIEW
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card >
    );
}
