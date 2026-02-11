import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Project {
    id: string;
    name: string;
    event_type: string | null;
    event_date: string | null;
    event_location: string | null;
    user_id: string;
}

interface ProfessionalSettings {
    business_name: string | null;
    logo_url: string | null;
    primary_color: string;
    phone: string | null;
    instagram: string | null;
}

interface Task {
    id: string;
    title: string;
    is_completed: boolean;
    visibility: string;
}

interface MoodboardImage {
    id: string;
    image_url: string;
    caption: string | null;
}

interface BriefingQuestion {
    id: string;
    question: string;
}

interface Briefing {
    id: string;
    questions: BriefingQuestion[];
    answers: Record<string, string>;
    is_submitted: boolean;
}

interface Contract {
    id: string;
    title: string;
    content: string;
    status: string;
}

interface Invoice {
    id: string;
    amount: number;
    description: string | null;
    status: string;
    due_date: string | null;
}

export type {
    Project as PortalProject,
    ProfessionalSettings as PortalSettings,
    Task as PortalTask,
    MoodboardImage,
    Briefing as PortalBriefing,
    BriefingQuestion,
    Contract as PortalContract,
    Invoice as PortalInvoice,
};

export function usePortalCliente(token: string | undefined) {
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [project, setProject] = useState<Project | null>(null);
    const [settings, setSettings] = useState<ProfessionalSettings | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [moodboard, setMoodboard] = useState<MoodboardImage[]>([]);
    const [briefing, setBriefing] = useState<Briefing | null>(null);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [briefingAnswers, setBriefingAnswers] = useState<Record<string, string>>({});
    const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        setLoading(true);

        const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('id, name, event_type, event_date, event_location, user_id')
            .eq('public_token', token)
            .maybeSingle();

        if (projectError || !projectData) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        setProject(projectData);

        const { data: settingsData } = await supabase
            .from('professional_settings')
            .select('business_name, logo_url, primary_color, phone, instagram')
            .eq('user_id', projectData.user_id)
            .maybeSingle();
        setSettings(settingsData);

        const { data: tasksData } = await supabase
            .from('tasks')
            .select('id, title, is_completed, visibility')
            .eq('project_id', projectData.id)
            .in('visibility', ['shared', 'client'])
            .order('sort_order');
        setTasks(tasksData || []);

        const { data: moodboardData } = await supabase
            .from('moodboard_images')
            .select('id, image_url, caption')
            .eq('project_id', projectData.id)
            .order('created_at', { ascending: false });
        setMoodboard(moodboardData || []);

        const { data: briefingData } = await supabase
            .from('briefings')
            .select('id, questions, answers, is_submitted')
            .eq('project_id', projectData.id)
            .maybeSingle();

        if (briefingData) {
            setBriefing({
                ...briefingData,
                questions: briefingData.questions as unknown as BriefingQuestion[],
                answers: briefingData.answers as Record<string, string>
            });
            setBriefingAnswers(briefingData.answers as Record<string, string>);
        }

        const { data: contractsData } = await supabase
            .from('contracts')
            .select('id, title, content, status')
            .eq('project_id', projectData.id)
            .in('status', ['sent', 'signed']);
        setContracts(contractsData || []);

        const { data: invoicesData } = await supabase
            .from('invoices')
            .select('id, amount, description, status, due_date')
            .eq('project_id', projectData.id)
            .order('created_at', { ascending: false });
        setInvoices(invoicesData || []);

        setLoading(false);
    };

    const toggleClientTask = async (taskId: string, completed: boolean) => {
        const { error } = await supabase
            .from('tasks')
            .update({ is_completed: completed })
            .eq('id', taskId)
            .eq('visibility', 'client');

        if (!error) {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: completed } : t));
        }
    };

    const submitBriefing = async () => {
        if (!briefing) return;

        const { error } = await supabase
            .from('briefings')
            .update({
                answers: briefingAnswers,
                is_submitted: true,
                submitted_at: new Date().toISOString()
            })
            .eq('id', briefing.id);

        if (error) {
            toast({ title: 'Erro ao enviar respostas', variant: 'destructive' });
        } else {
            toast({ title: 'Respostas enviadas com sucesso!' });
            setBriefing({ ...briefing, is_submitted: true, answers: briefingAnswers });
        }
    };

    const handlePayment = async (invoice: Invoice) => {
        setPayingInvoiceId(invoice.id);

        try {
            const response = await supabase.functions.invoke('create-payment', {
                body: {
                    invoice_id: invoice.id,
                    invoice_amount: invoice.amount,
                    invoice_description: invoice.description,
                    project_name: project?.name,
                }
            });

            if (response.error) {
                toast({ title: 'Erro ao iniciar pagamento', description: response.error.message, variant: 'destructive' });
                return;
            }

            const { init_point } = response.data;
            if (init_point) {
                window.location.href = init_point;
            } else {
                toast({ title: 'Erro ao gerar link de pagamento', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Erro ao processar pagamento', variant: 'destructive' });
        } finally {
            setPayingInvoiceId(null);
        }
    };

    return {
        loading,
        notFound,
        project,
        settings,
        tasks,
        moodboard,
        briefing,
        contracts,
        invoices,
        briefingAnswers,
        setBriefingAnswers,
        payingInvoiceId,
        toggleClientTask,
        submitBriefing,
        handlePayment,
    };
}
