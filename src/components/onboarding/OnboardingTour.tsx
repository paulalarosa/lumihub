import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

export default function OnboardingTour({ runManual, onManualClose }: { runManual?: boolean; onManualClose?: () => void }) {
    const { user } = useAuth();
    const location = useLocation();
    const [run, setRun] = useState(false);

    const steps: Step[] = [
        {
            target: 'body',
            content: (
                <div className="text-center p-2">
                    <h3 className="text-lg font-bold mb-2 text-[#00e5ff]">Bem-vinda ao LumiHub! ✨</h3>
                    <p className="text-sm text-gray-300">
                        Sua plataforma de gestão completa. Vamos fazer um tour rápido para você dominar seu império?
                    </p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: 'a[href="/agenda"]',
            content: 'Aqui você visualiza e gerencia todos os seus agendamentos em um só lugar.',
            title: 'Agenda Inteligente',
        },
        {
            target: 'a[href="/clientes"]',
            content: 'Gerencie suas clientes, mantenha histórico e fidelize com um CRM completo.',
            title: 'Gestão de Clientes',
        },
        {
            target: 'a[href="/dashboard/financial"]',
            content: 'Acompanhe seus ganhos, comissões e fluxo de caixa em tempo real.',
            title: 'Financeiro',
        },
        {
            target: 'a[href="/admin/dashboard"]', // Assuming Admin usually sees this, or maybe a generic analytics link if available for all users. 
            // If not available for all, might skip or show conditionally. 
            // For now pointing to dashboard generic metric or skip if not present.
            // Let's target the Dashboard link generally as "metrics center"
            content: 'Visualize o crescimento do seu negócio com gráficos e métricas detalhadas.',
            title: 'Visão Geral',
        }
    ];

    useEffect(() => {
        const checkOnboardingStatus = async () => {
            if (!user) return;

            if (runManual) {
                setRun(true);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('onboarding_completed')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                if (data && !data.onboarding_completed) {
                    setRun(true);
                }
            } catch (error) {
                console.error('Error checking onboarding status:', error);
            }
        };

        checkOnboardingStatus();
    }, [user, runManual]);

    const handleJoyrideCallback = async (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            if (onManualClose) onManualClose();

            if (user && !runManual) {
                try {
                    await supabase
                        .from('profiles')
                        .update({ onboarding_completed: true })
                        .eq('id', user.id);
                } catch (error) {
                    console.error('Error updating onboarding status:', error);
                }
            }
        }
    };

    // Only run on Dashboard or similar main pages to ensure elements exist
    // Or force user to dashboard?
    // For simplicity, we assume elements in Sidebar are always present.

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#00e5ff',
                    textColor: '#e5e7eb',
                    backgroundColor: '#1a1a1a',
                    arrowColor: '#1a1a1a',
                    overlayColor: 'rgba(0, 0, 0, 0.8)',
                    zIndex: 1000,
                },
                tooltip: {
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                },
                buttonNext: {
                    backgroundColor: '#00e5ff',
                    color: '#000',
                    fontWeight: 600,
                },
                buttonBack: {
                    color: '#9ca3af',
                }
            }}
            locale={{
                back: 'Voltar',
                close: 'Fechar',
                last: 'Concluir',
                next: 'Próximo',
                skip: 'Pular',
            }}
        />
    );
}
