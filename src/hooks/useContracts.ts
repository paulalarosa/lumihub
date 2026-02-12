import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Logger } from '@/services/logger';

export interface Contract {
    id: string;
    project_id: string;
    title: string;
    content?: string;
    status: string; // Supabase returns string, not enum
    created_at: string;
    signature_url?: string;
    signed_at?: string;
    attachment_url?: string;
    project?: {
        name: string;
    };
}

export function useContracts() {
    const { user } = useAuth();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchContracts = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('contracts')
            .select(`
                *,
                project:projects(name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching contracts:', error);
            toast.error('Erro ao carregar contratos');
        } else {
            setContracts(data);
        }
        setLoading(false);
    };

    const createContract = async (contract: Partial<Contract> & { project_id: string }) => {
        if (!user) return;
        const { data, error } = await supabase
            .from('contracts')
            .insert([{
                title: contract.title || 'Contrato',
                content: contract.content || '',
                status: contract.status || 'draft',
                project_id: contract.project_id,
                user_id: user.id
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating contract:', error);
            toast.error('Erro ao criar contrato');
            throw error;
        }

        // Audit the action
        Logger.action("CONTRACT_CREATE", user.id, "contracts", data.id, {
            title: data.title,
            project_id: data.project_id
        });

        setContracts([data, ...contracts]);
        toast.success('Contrato criado com sucesso');
        return data;
    };

    const uploadContractFile = async (file: File) => {
        if (!user) throw new Error('User not authenticated');

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('contracts')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        // Audit the action
        Logger.action("CONTRACT_UPLOAD", user.id, "storage.contracts", filePath, {
            fileName: file.name
        });

        return filePath;
    };

    const getFileUrl = async (path: string) => {
        const { data, error } = await supabase.storage
            .from('contracts')
            .createSignedUrl(path, 3600); // 1 hour

        if (error) throw error;
        return data.signedUrl;
    }

    return {
        contracts,
        loading,
        fetchContracts,
        createContract,
        uploadContractFile,
        getFileUrl
    };
}
