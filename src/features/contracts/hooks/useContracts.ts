import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from "sonner";
import { Contract, Client } from '../types';

export const useContracts = () => {
    const { user } = useAuth();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Dialog & Form States
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newClient, setNewClient] = useState("");
    const [newContent, setNewContent] = useState("");
    const [clients, setClients] = useState<Client[]>([]);

    // Signature State
    const [signatureOpen, setSignatureOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

    useEffect(() => {
        if (user) {
            fetchContracts();
            fetchClients();
        }
    }, [user]);

    const fetchContracts = async () => {
        try {
            setLoading(true);
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
                .eq('user_id', user?.id || '')
                .order('created_at', { ascending: false });

            if (apiError) throw apiError;

            // Fetch client names manually since relation setup is tricky
            const clientIds = (contractsData || [])
                .map(c => c.client_id)
                .filter((id): id is string => !!id && id.length > 0);

            let clientsMap: Record<string, string> = {};

            if (clientIds.length > 0) {
                const { data: clientsData } = await supabase
                    .from('wedding_clients')
                    .select('id, name:full_name')
                    .in('id', clientIds);

                if (clientsData) {
                    clientsData.forEach((c: any) => {
                        clientsMap[c.id] = c.name;
                    });
                }
            }

            const formattedContracts: Contract[] = (contractsData || []).map(c => ({
                id: c.id,
                title: c.title,
                client_id: c.client_id,
                status: c.status as 'draft' | 'sent' | 'signed',
                created_at: c.created_at,
                signed_at: c.signed_at,
                content: c.content,
                signature_url: c.signature_url,
                clients: { name: clientsMap[c.client_id] || 'Cliente Desconhecido' }
            }));

            setContracts(formattedContracts);
        } catch (error) {
            console.error("Error fetching contracts:", error);
            toast.error("Erro ao carregar contratos");
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
        if (!newTitle || !newClient) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        setIsSubmitting(true);
        const { error } = await supabase.from('contracts').insert({
            user_id: user?.id,
            title: newTitle,
            client_id: newClient,
            content: newContent || "Conteúdo do contrato...",
            status: 'draft'
        });

        setIsSubmitting(false);

        if (error) {
            console.error(error);
            toast.error("Erro ao criar contrato");
        } else {
            toast.success("Contrato criado com sucesso");
            setIsDialogOpen(false);
            fetchContracts();
            setNewTitle("");
            setNewClient("");
            setNewContent("");
        }
    };

    const handleSignatureSave = async (dataUrl: string) => {
        if (!selectedContract) return;

        try {
            const fileName = `${selectedContract.id}_signature_${Date.now()}.png`;
            const blob = await fetch(dataUrl).then(res => res.blob());

            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('contract-signatures')
                .upload(fileName, blob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase
                .storage
                .from('contract-signatures')
                .getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('contracts')
                .update({
                    status: 'signed',
                    signature_url: publicUrl,
                    signed_at: new Date().toISOString()
                })
                .eq('id', selectedContract.id);

            if (updateError) throw updateError;

            toast.success("Contrato assinado com sucesso!");
            setSignatureOpen(false);
            fetchContracts();

        } catch (error) {
            console.error("Signature error:", error);
            toast.error("Erro ao salvar assinatura");
        }
    };

    const filteredContracts = contracts.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return {
        contracts,
        filteredContracts,
        loading,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        isDialogOpen,
        setIsDialogOpen,
        isSubmitting,
        newTitle,
        setNewTitle,
        newClient,
        setNewClient,
        newContent,
        setNewContent,
        clients,
        signatureOpen,
        setSignatureOpen,
        selectedContract,
        setSelectedContract,
        handleCreate,
        handleSignatureSave
    };
};
