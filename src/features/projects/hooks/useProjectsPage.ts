import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Project {
    id: string;
    name: string;
    event_type: string | null;
    event_date: string | null;
    event_location: string | null;
    status: string;
    public_token?: string;
    created_at: string;
    client: {
        id: string;
        full_name: string;
    } | null;
}

interface Client {
    id: string;
    full_name: string;
}

export type { Project, Client };

export function useProjectsPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, loading } = useAuth();
    const { toast } = useToast();

    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [name, setName] = useState('');
    const [clientId, setClientId] = useState(searchParams.get('cliente') || '');
    const [eventType, setEventType] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventLocation, setEventLocation] = useState('');

    useEffect(() => {
        if (!loading && !user) navigate('/auth');
    }, [user, loading, navigate]);

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    useEffect(() => {
        if (searchParams.get('cliente')) {
            setClientId(searchParams.get('cliente') || '');
            setIsDialogOpen(true);
        }
    }, [searchParams]);

    const fetchData = async () => {
        setLoadingData(true);

        const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*, client:wedding_clients(id, full_name)')
            .order('created_at', { ascending: false });

        if (!projectsError) {
            setProjects((projectsData as unknown as Project[]) || []);
        }

        const { data: clientsData } = await supabase
            .from('wedding_clients')
            .select('id, full_name')
            .order('full_name');

        setClients(clientsData || []);
        setLoadingData(false);
    };

    const resetForm = () => {
        setName('');
        setClientId('');
        setEventType('');
        setEventDate('');
        setEventLocation('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !clientId) {
            toast({ title: 'Nome e cliente são obrigatórios', variant: 'destructive' });
            return;
        }

        const { data, error } = await supabase
            .from('projects')
            .insert({
                name: name.trim(),
                client_id: clientId,
                event_type: eventType || null,
                event_date: eventDate || null,
                event_location: eventLocation.trim() || null,
                user_id: user!.id
            })
            .select()
            .single();

        if (error) {
            toast({ title: 'Erro ao criar projeto', variant: 'destructive' });
        } else {
            toast({ title: 'Projeto inicializado' });

            supabase.functions.invoke('send-welcome-email', {
                body: { clientId, projectName: name.trim() }
            }).then(({ error: fnError }) => {
                if (fnError) {
                    toast({ title: 'Projeto criado, mas houve erro no email de boas-vindas.', variant: 'destructive' });
                } else {
                    toast({ title: 'Email de acesso enviado para a cliente!' });
                }
            });

            setIsDialogOpen(false);
            resetForm();
            navigate(`/projetos/${data.id}`);
        }
    };

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.client as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
        user,
        loading,
        loadingData,
        projects,
        clients,
        filteredProjects,
        searchTerm, setSearchTerm,
        isDialogOpen, setIsDialogOpen,
        name, setName,
        clientId, setClientId,
        eventType, setEventType,
        eventDate, setEventDate,
        eventLocation, setEventLocation,
        handleSubmit,
        navigate,
    };
}
