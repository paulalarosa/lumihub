import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Contract {
    id: string;
    client_id: string;
    title: string;
    content?: string;
    status: 'draft' | 'sent' | 'signed';
    created_at: string;
    signature_url?: string;
    signed_at?: string;
    attachment_url?: string;
    client?: {
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
                client:clients(name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching contracts:', error);
            toast.error('Erro ao carregar contratos');
        } else {
            setContracts(data as any);
        }
        setLoading(false);
    };

    const createContract = async (contract: Partial<Contract>) => {
        if (!user) return;
        const { data, error } = await supabase
            .from('contracts')
            .insert([{ ...contract, user_id: user.id }])
            .select()
            .single();

        if (error) {
            console.error('Error creating contract:', error);
            toast.error('Erro ao criar contrato');
            throw error;
        }

        setContracts([data as any, ...contracts]);
        toast.success('Contrato criado com sucesso');
        return data;
    };

    const uploadContractFile = async (file: File) => {
        if (!user) throw new Error('User not authenticated');

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('contract-files')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('contract-files')
            .getPublicUrl(filePath);

        // Since bucket is private, we might need a signed URL instead
        // But for simplicity in this "MVP" flow, if we want persistent access, 
        // we usually make it public OR generate signed URLs on the fly.
        // Given the requirement "Users need to upload... (PDFs)", and usually contracts are sensitive, 
        // a private bucket + signed URL is best. 
        // However, `getPublicUrl` returns a URL that works if the bucket is public.
        // If bucket is private, we need `createSignedUrl`. 

        // Let's use createSignedUrl for 1 hour for preview, or store the path and sign on retrieval.
        // Ideally we store the PATH in db, not the signed URL (which expires).
        // But the prompt asks to save "URL". 
        // Let's stick to storing the Path or Public URL if we switch bucket to public. 
        // The migration set it to `false` (private).
        // So we should return the path.

        return filePath;
    };

    const getFileUrl = async (path: string) => {
        const { data, error } = await supabase.storage
            .from('contract-files')
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
