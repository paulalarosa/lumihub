import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, ArrowRight, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function InviteLanding() {
    const [searchParams] = useSearchParams();
    const { token: paramToken } = useParams();
    const token = paramToken || searchParams.get('token');
    const navigate = useNavigate();

    const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
    const [inviteData, setInviteData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        instagram: '',
        password: '',
        confirmPassword: ''
    });

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
                .from('assistants')
                .select('*, owner:user_id(full_name)') // owner is linked via user_id
                .eq('invite_token', token)
                .maybeSingle(); // Use maybeSingle to avoid 406 error if multiple match (though unlikely) or none

            if (error || !data) {
                // Fallback for legacy invites table if helper function was used differently? 
                // Stick to the provided table structure if possible. 
                // Re-reading types.ts, 'assistants' has 'invite_token'.
                // If the previous code used 'assistant_invites', I should check that too.
                // The previous code had: .from('assistant_invites'). THIS IS DIFFERENT.
                // But the 'assistants' table in types.ts HAS 'invite_token'.
                // I will try to query 'assistants' table first as it seems to be the main one.
                console.error("Assistant token check error:", error);

                // Fallback to what was there before check
                const { data: oldData, error: oldError } = await supabase
                    .from('assistant_invites' as any)
                    .select('*, owner:owner_id(full_name)')
                    .or(`invite_code.eq.${token},token.eq.${token}`)
                    .eq('status', 'pending')
                    .maybeSingle();

                if (oldError || !oldData) {
                    setStatus('invalid');
                    return;
                }
                setInviteData({ ...(oldData as object), isLegacy: true });
                setStatus('valid');
                return;
            }

            if (data.is_registered) {
                toast.error("Este convite já foi utilizado.");
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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }

        if (formData.password.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setLoading(true);

        try {
            // 1. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: inviteData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                const userId = authData.user.id;

                // 2. Update Profile Name
                await supabase.from('profiles').update({
                    full_name: formData.fullName,
                    onboarding_completed: true // Skip onboarding for assistants
                }).eq('id', userId);

                // 3. Update Professional Settings (Instagram, Phone)
                // Need to verify if record exists or upsert.
                const { error: settingsError } = await supabase.from('professional_settings').upsert({
                    user_id: userId,
                    instagram: formData.instagram,
                    phone: formData.phone,
                    is_public: true
                });

                if (settingsError) console.error("Error updating settings:", settingsError);

                // 4. Link Assistant Record
                if (inviteData.isLegacy) {
                    // Handle legacy invite accepting logic if needed, but for now assuming new system
                    // If it's legacy, we need to create an assistant record or find one?
                    // Let's assume standard flow for simplicity as per user request
                    // We might need to find the assistant record by email if token was from invites table
                    const { data: existingAssistant } = await supabase
                        .from('assistants')
                        .select('id')
                        .eq('email', inviteData.email)
                        .eq('user_id', inviteData.owner_id)
                        .maybeSingle();

                    if (existingAssistant) {
                        await supabase.from('assistants').update({
                            assistant_user_id: userId,
                            is_registered: true,
                            phone: formData.phone,
                            name: formData.fullName
                        }).eq('id', existingAssistant.id);
                    }
                } else {
                    // Update the assistant record found by token
                    const { error: assistantError } = await supabase
                        .from('assistants')
                        .update({
                            assistant_user_id: userId,
                            is_registered: true,
                            phone: formData.phone,
                            name: formData.fullName,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', inviteData.id);

                    if (assistantError) throw assistantError;
                }

                toast.success("Cadastro realizado com sucesso!");
                navigate('/dashboard');
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Erro ao realizar cadastro.");
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white p-6">
                <div className="max-w-md w-full border border-neutral-800 p-12 text-center bg-[#050505]">
                    <AlertCircle className="w-12 h-12 text-white/50 mx-auto mb-6" />
                    <h1 className="text-2xl font-serif text-white mb-4">Convite Expirado</h1>
                    <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest mb-8">
                        Este link não é mais válido ou foi revogado.
                    </p>
                    <Button onClick={() => navigate('/')} className="w-full bg-white text-black hover:bg-neutral-200 rounded-none font-bold uppercase tracking-widest text-xs h-12">
                        Voltar ao Início
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans selection:bg-white selection:text-black">

            <div className="w-full max-w-lg border border-neutral-800 bg-[#050505] relative animate-in fade-in duration-700">
                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white" />

                <div className="p-10 md:p-14">
                    <div className="text-center mb-10">
                        <div className="inline-flex justify-center items-center w-12 h-12 border border-neutral-800 mb-6 bg-neutral-900">
                            <UserPlus className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-[0.3em] mb-3">Convite Profissional</p>
                        <h1 className="text-3xl font-serif text-white tracking-wide">
                            Junte-se à Equipe
                        </h1>
                        <p className="mt-2 text-xs text-neutral-400 font-mono uppercase tracking-widest">
                            {inviteData?.owner?.full_name ? `Studio: ${inviteData.owner.full_name}` : 'Lumi Hub'}
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Email</label>
                            <Input
                                disabled
                                value={inviteData.email}
                                className="bg-neutral-900/50 border-neutral-800 text-neutral-500 rounded-none h-12 font-mono text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Nome Completo</label>
                            <Input
                                required
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="bg-neutral-900 border-neutral-800 text-white rounded-none h-12 focus:border-white transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Celular / WhatsApp</label>
                                <Input
                                    required
                                    value={formData.phone}
                                    placeholder="(00) 00000-0000"
                                    onChange={(e) => {
                                        // Simple mask for phone
                                        let val = e.target.value.replace(/\D/g, '');
                                        if (val.length > 11) val = val.slice(0, 11);
                                        // Apply formatting
                                        if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
                                        if (val.length > 10) val = `${val.slice(0, 10)}-${val.slice(10)}`;

                                        setFormData({ ...formData, phone: val })
                                    }}
                                    className="bg-neutral-900 border-neutral-800 text-white rounded-none h-12 focus:border-white transition-colors placeholder:text-neutral-700"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Instagram</label>
                                <Input
                                    value={formData.instagram}
                                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                    placeholder="@usuario"
                                    className="bg-neutral-900 border-neutral-800 text-white rounded-none h-12 focus:border-white transition-colors placeholder:text-neutral-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Senha</label>
                                <Input
                                    required
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="bg-neutral-900 border-neutral-800 text-white rounded-none h-12 focus:border-white transition-colors"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Confirmar</label>
                                <Input
                                    required
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="bg-neutral-900 border-neutral-800 text-white rounded-none h-12 focus:border-white transition-colors"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black hover:bg-neutral-200 rounded-none font-bold uppercase tracking-[0.2em] text-xs h-14 mt-4"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <span className="flex items-center gap-2">
                                    Confirmar Cadastro <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-[10px] text-neutral-600 uppercase tracking-widest mt-8">
                        Lumi Hub Assistance Program
                    </p>
                </div>
            </div>
        </div>
    );
}
