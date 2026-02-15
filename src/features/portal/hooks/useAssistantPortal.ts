import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePortal } from './usePortal';
import { toast } from 'sonner';

type TabType = 'dashboard' | 'agenda' | 'tarefas' | 'financeiro' | 'convites';

export type { TabType };

export function useAssistantPortal() {
    const { user, signOut, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedAssistantId, setSelectedAssistantId] = useState<string>('all');
    const [premiumModalOpen, setPremiumModalOpen] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState('');

    const { assistantsList, employersMap, events, isLoading, acceptInvite } = usePortal(currentMonth, selectedAssistantId);

    useEffect(() => {
        if (!authLoading && !user) navigate('/auth');
    }, [user, authLoading, navigate]);

    const activeAssistants = assistantsList.filter(a => a.status === 'accepted' || a.is_registered);
    const pendingInvites = assistantsList.filter(a => a.status === 'pending' && !a.is_registered);
    const currentAssistantName = user?.user_metadata?.full_name?.split(' ')[0] || 'Assistente';

    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const upcomingEvents = events
        .filter(e => {
            const eventDate = new Date(e.event_date);
            return eventDate >= today;
        })
        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    const nextEvent = upcomingEvents[0];

    const handleAcceptInvite = async (id: string) => {
        try {
            await acceptInvite(id);
            toast.success('Convite aceito! Dados sincronizados.');
            setActiveTab('dashboard');
        } catch (_) {
            toast.error('Erro ao aceitar convite.');
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    return {
        user,
        authLoading,
        isLoading,
        activeTab,
        setActiveTab,
        currentMonth,
        setCurrentMonth,
        selectedAssistantId,
        setSelectedAssistantId,
        premiumModalOpen,
        setPremiumModalOpen,
        selectedFeature,
        setSelectedFeature,
        assistantsList,
        employersMap,
        events,
        activeAssistants,
        pendingInvites,
        currentAssistantName,
        upcomingEvents,
        nextEvent,
        handleAcceptInvite,
        handleLogout,
    };
}
