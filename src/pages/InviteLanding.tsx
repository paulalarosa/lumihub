import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function InviteLanding() {
    const [searchParams] = useSearchParams();
    const { token: paramToken } = useParams();
    const token = paramToken || searchParams.get('token');
    const navigate = useNavigate();
    const { user } = useAuth();

    const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading');
    const [inviteData, setInviteData] = useState<any>(null);

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            return;
        }
        checkInvite();
    }, [token]);

    const checkInvite = async () => {
        try {
            const { data, error } = await supabase
                .from('assistant_invites' as any)
                .select('*, owner:owner_id(full_name)')
                .or(`invite_code.eq.${token},token.eq.${token}`) // Support both legacy token and new code
                .eq('status', 'pending')
                .single();

            if (error || !data) {
                setStatus('invalid');
                return;
            }

            setInviteData(data);
            setStatus('valid');
        } catch (error) {
            console.error(error);
            setStatus('invalid');
        }
    };

    const handleAccept = async () => {
        if (!user) {
            // Should redirect to auth with return url, but simpler for now to ask them to login first
            // Actually, we can just let them click "Login" and they come back if we persist state?
            // Easiest is: "Please login to accept"
            navigate('/auth', { state: { from: `/entrar-equipe?token=${token}` } });
            return;
        }

        setStatus('loading');
        try {
            // 1. Update Profile (Link to Parent)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ parent_user_id: inviteData.owner_id } as any)
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Update Invite Status
            const { error: inviteError } = await supabase
                .from('assistant_invites' as any)
                .update({ status: 'accepted' })
                .eq('id', inviteData.id);

            if (inviteError) throw inviteError;

            setStatus('success');
            toast.success('Você entrou na equipe com sucesso!');
            setTimeout(() => navigate('/dashboard'), 2000);

        } catch (error) {
            console.error('Error accepting invite:', error);
            toast.error('Erro ao aceitar convite.');
            setStatus('valid'); // Reset to try again
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-[#00e5ff]" />
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white p-4">
                <div className="max-w-md text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <h1 className="text-2xl font-serif">Convite Inválido</h1>
                    <p className="text-gray-400">Este link de convite expirou ou não existe mais.</p>
                    <Button onClick={() => navigate('/')} variant="outline">Voltar ao Início</Button>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white p-4">
                <div className="max-w-md text-center space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    <h1 className="text-2xl font-serif">Bem-vindo à Equipe!</h1>
                    <p className="text-gray-400">Você agora faz parte do studio de {inviteData?.owner?.full_name || 'Alguém'}.</p>
                    <p className="text-sm text-gray-500">Redirecionando para o dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px]" />
            </div>

            <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-xl relative z-10">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-[#00e5ff]/10 rounded-full flex items-center justify-center mx-auto border border-[#00e5ff]/20">
                        <CheckCircle2 className="w-8 h-8 text-[#00e5ff]" />
                    </div>
                    <h1 className="text-2xl font-serif">Convite para Equipe</h1>
                    <p className="text-gray-300">
                        Você foi convidado para entrar no time de <strong className="text-white">{inviteData?.owner?.full_name}</strong>.
                    </p>

                    <div className="pt-4 space-y-3">
                        {!user ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-sm text-yellow-200">
                                Você precisa fazer login ou criar uma conta para aceitar.
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">
                                Aceitando como: <span className="text-white">{user.email}</span>
                            </p>
                        )}

                        <Button
                            className="w-full bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90 font-medium h-12"
                            onClick={handleAccept}
                        >
                            {user ? 'Aceitar Convite' : 'Fazer Login e Aceitar'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
