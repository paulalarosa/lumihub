import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CHECKLIST_ITEMS = [
    {
        id: 'profile_customized',
        title: 'Completar Perfil',
        description: 'Adicione suas informações profissionais',
        path: '/configuracoes', // Adjusted path or redirect logic might be needed
        cta: 'Configurar',
    },
    {
        id: 'first_client_added',
        title: 'Cadastrar Primeira Cliente',
        description: 'Comece adicionando uma cliente',
        path: '/clientes',
        cta: 'Adicionar Cliente',
    },
    {
        id: 'first_event_created',
        title: 'Criar Primeiro Evento',
        description: 'Agende seu primeiro serviço',
        path: '/calendar',
        cta: 'Criar Evento',
    },
    {
        id: 'calendar_synced',
        title: 'Sincronizar Google Calendar',
        description: 'Nunca perca um compromisso',
        path: '/configuracoes', // Adjusted path
        cta: 'Conectar',
    },
    {
        id: 'first_contract_generated',
        title: 'Gerar Primeiro Contrato',
        description: 'Profissionalize seus acordos',
        path: '/contratos',
        cta: 'Ver Contratos',
    },
];

export const SetupChecklist = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data: onboarding } = useQuery({
        queryKey: ['user-onboarding'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_onboarding')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },
        enabled: !!user,
    });

    if (!onboarding || onboarding.is_completed) return null;

    const completedCount = CHECKLIST_ITEMS.filter(
        (item) => onboarding[item.id as keyof typeof onboarding] === true
    ).length;

    const progress = (completedCount / CHECKLIST_ITEMS.length) * 100;

    // If all completed, don't show or show success state? 
    // Requirement says "if completed return null" so it disappears.
    if (completedCount === CHECKLIST_ITEMS.length) return null;

    return (
        <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 mb-6">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Configure sua Conta</CardTitle>
                    <span className="text-sm font-semibold text-purple-400">
                        {completedCount}/{CHECKLIST_ITEMS.length}
                    </span>
                </div>
                <Progress value={progress} className="h-2 bg-neutral-800" />
            </CardHeader>

            <CardContent className="space-y-3">
                {CHECKLIST_ITEMS.map((item) => {
                    const isCompleted = onboarding[item.id as keyof typeof onboarding] === true;

                    return (
                        <div
                            key={item.id}
                            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isCompleted ? 'bg-green-900/10 border border-green-900/30' : 'bg-neutral-800/50 hover:bg-neutral-800 border border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {isCompleted ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                ) : (
                                    <Circle className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                                )}

                                <div>
                                    <p className={`font-medium text-sm ${isCompleted ? 'text-green-400/70 line-through' : 'text-white'}`}>
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-neutral-400">{item.description}</p>
                                </div>
                            </div>

                            {!isCompleted && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(item.path)}
                                    className="h-8 text-xs bg-neutral-900 border-neutral-700 hover:text-white"
                                >
                                    {item.cta}
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};
