
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { ProjectService as ProjectServiceAPI } from '@/services/projectService';
import type { Contract, ProjectWithRelations, ProjectServiceItem, Profile } from '@/types/api.types';
import jsPDF from 'jspdf';

interface UseContratosProps {
    projectId: string;
    project: ProjectWithRelations;
    projectServices: ProjectServiceItem[];
    totalValue: number;
    setContracts: (contracts: Contract[]) => void;
}

export function useContratos({ projectId, project, projectServices, totalValue, setContracts }: UseContratosProps) {
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
    }, [projectId, setContracts]);

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
            // Refresh contracts
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
            const userProfile = contractor;

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

    return {
        isContractDialogOpen,
        setIsContractDialogOpen,
        contractTitle,
        setContractTitle,
        contractContent,
        setContractContent,
        loadingAI,
        loadingEdit,
        aiCommand,
        setAiCommand,
        contractor,
        handleSaveContract,
        handleExportPDF,
        shareOnWhatsApp,
        handleArchitectMode,
        handleEditorMode
    };
}
