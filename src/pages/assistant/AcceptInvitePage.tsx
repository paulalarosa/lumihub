
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { AssistantSignupForm } from '@/components/features/assistants/AssistantSignupForm';

export default function AcceptInvitePage() {
    const { token } = useParams<{ token: string }>();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If auth is loading, wait.
        if (authLoading) return;

        // If user is logged in, and token exists, and not already processing/errored
        if (user && token && !processing && !error) {
            acceptInvite();
        }
    }, [user, authLoading, token]); // Dependencies

    const acceptInvite = async () => {
        if (!token || !user) return;
        setProcessing(true);

        try {
            const { data, error } = await supabase.rpc('accept_assistant_invite', {
                p_invite_token: token,
                p_user_id: user.id
            });

            if (error) throw error;

            if (data.success) {
                toast({
                    title: data.is_new_connection ? 'Acesso Concedido!' : 'Acesso Verificado',
                    description: 'Você agora tem acesso à agenda desta maquiadora.'
                });
                // Redirect to Assistant Dashboard
                setTimeout(() => navigate('/assistant/dashboard'), 1500);
            } else {
                const errorMessage = data.error || 'Convite inválido ou expirado.';
                setError(errorMessage);
                toast({ title: 'Erro', description: errorMessage, variant: 'destructive' });
            }
        } catch (err) {
            setError(err.message);
            toast({ title: 'Erro ao aceitar convite', description: err.message, variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    if (authLoading) return <div className="flex justify-center mt-20"><LoadingSpinner /></div>;

    // If user is not logged in, show signup form
    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <AssistantSignupForm token={token || ''} />
            </div>
        );
    }

    // If user is logged in but processing invite
    if (processing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <LoadingSpinner className="w-8 h-8 mb-4" />
                <p className="text-muted-foreground animate-pulse">Verificando convite e configurando acesso...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-8 rounded-lg max-w-md w-full text-center shadow-lg">
                    <h3 className="text-xl font-bold mb-4">Erro no Convite</h3>
                    <p className="mb-6">{error}</p>
                    <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                        Voltar para Início
                    </Button>
                </div>
            </div>
        );
    }

    return null; // Should redirect or show error/processing state
};
