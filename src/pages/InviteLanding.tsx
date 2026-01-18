import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, ArrowRight, UserPlus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function InviteLanding() {
    const { token: pathToken } = useParams();
    const [searchParams] = useSearchParams();
    // Prioritize path token, then search param (backwards compatibility or manual entry)
    const token = pathToken || searchParams.get('token');

    const navigate = useNavigate();

    const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
    const [inviteData, setInviteData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
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
            // Check assistants table first
            const { data, error } = await supabase
                .from('assistants')
                .select('id, email, name, status, is_registered, invite_token')
                .eq('invite_token', token)
                .maybeSingle();

            if (error || !data) {
                console.error("Assistant token check error:", error);
                setStatus('invalid');
                return;
            }

            if (data.is_registered) {
                toast.error("Este convite já foi utilizado.");
                // Redirect to login if already registered
                navigate('/auth');
                return;
            }

            if (data.status !== 'pending') {
                // If status is accepted but not registered (edge case?), or already active
                // We treat as invalid for onboarding purposes unless specifically handling re-onboarding
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
            // 1. Sign Up - EXTREME CLEANING
            const originalEmail = inviteData.email;
            const sanitizedEmail = originalEmail.replace(/[^\x20-\x7E]/g, "").trim().toLowerCase();

            console.log("DEBUG AUTH - Sanitized:", `"${sanitizedEmail}"`);

            let userId = null;

            // Attempt Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: sanitizedEmail,
                password: formData.password.trim(),
                options: {
                    data: {
                        full_name: formData.fullName.trim(),
                        phone: formData.phone.trim(),
                        role: 'assistant'
                    }
                }
            });

            if (authError) {
                // HANDLE EXISTING USER (Multi-Maquiadora Scenario)
                if (authError.message.includes("already registered") || authError.status === 400) {
                    console.log("User exists, attempting URL-less login to link account...");

                    // Try to LOGIN with provided credentials
                    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                        email: sanitizedEmail,
                        password: formData.password.trim()
                    });

                    if (loginError) {
                        toast.error("Este e-mail já existe. Se for você, use a senha correta para vincular.");
                        setLoading(false);
                        return;
                    }

                    if (loginData.user) {
                        userId = loginData.user.id;
                        toast.success("Conta identificada! Vinculando novo contrato...");
                    }
                } else {
                    throw authError;
                }
            } else if (authData.user) {
                userId = authData.user.id;
            }

            if (userId) {
                console.log("DEBUG ONBOARDING - Linking to user:", userId);

                // 2. Ensure Profile Exists (Upsert)
                // We keep existing profile data if it exists, only ensuring role/onboarding for safety
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: userId,
                    // Only update name if it wasn't set? prefer existing profile.
                    // Actually, if it's a new link, we assume they might want to update, but safer to respect existing.
                    full_name: formData.fullName.trim(),
                    role: 'assistant',
                    updated_at: new Date().toISOString()
                } as any, { onConflict: 'id', ignoreDuplicates: true }); // Prefer existing profile

                // 3. Link Assistant Record & Consume Token
                // This is the MAGIC STEP: It links this specific invite (employer) to the user
                const { error: updateError } = await supabase
                    .from('assistants')
                    .update({
                        assistant_user_id: userId, // Links to the centralized User
                        is_registered: true,
                        status: 'accepted',
                        phone: formData.phone.trim(),
                        name: formData.fullName.trim(),
                        invite_token: null // Consumes token
                    })
                    .eq('id', inviteData.id);

                if (updateError) {
                    console.error("Failed to link account:", updateError);
                    throw updateError;
                }

                toast.success("Acesso liberado com sucesso!");

                // 5. Redirect to Portal
                navigate('/portal-assistente');
            }
        } catch (error: any) {
            console.error("Registration error:", error);
            toast.error(error.message || "Erro ao processar.");
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full border border-neutral-800 bg-black p-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-neutral-800"></div>
                    <AlertCircle className="h-12 w-12 text-neutral-500 mx-auto mb-6" />
                    <h2 className="text-xl font-serif text-white tracking-widest uppercase mb-2">Convite Inválido</h2>
                    <p className="text-neutral-400 font-mono text-xs uppercase tracking-widest mb-8">
                        Este link expirou ou não existe.
                    </p>
                    <Button
                        onClick={() => navigate('/')}
                        className="w-full rounded-none bg-white text-black hover:bg-neutral-200 font-bold uppercase tracking-widest"
                    >
                        Voltar ao Início
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 selection:bg-white selection:text-black">
            <div className="max-w-lg w-full relative group">
                {/* Decorative border effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-neutral-800 to-neutral-900 opacity-50 group-hover:opacity-75 transition duration-1000 blur-sm"></div>

                <div className="relative bg-black border border-neutral-800 p-8 md:p-12">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="flex justify-center mb-6">
                            <div className="h-16 w-16 bg-white/5 border border-white/10 flex items-center justify-center rounded-none">
                                <ShieldCheck className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-serif text-white uppercase tracking-widest mb-2">
                            Lumi Hub
                        </h1>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.3em] mb-6">
                            Precisão. Controle. Estética.
                        </p>
                        <div className="h-px w-24 bg-neutral-800 mx-auto"></div>
                        <p className="mt-6 text-sm text-neutral-400 font-mono leading-relaxed">
                            Você foi convidada para o backstage.
                            <br />
                            <span className="text-white">Confirme suas credenciais para acessar o império.</span>
                        </p>
                    </div>

                    {/* Registration Form */}
                    <form onSubmit={handleRegister} className="space-y-6">
                        {/* Invitation Info (Read-only) */}
                        <div className="bg-neutral-900/30 border border-neutral-800 p-4 mb-6">
                            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Email Convidado</p>
                            <p className="text-white font-mono text-sm">{inviteData.email}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Nome Completo</label>
                                <Input
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                    className="bg-black border-neutral-800 text-white rounded-none focus:ring-1 focus:ring-white h-12"
                                    placeholder="SEU NOME"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">WhatsApp</label>
                                <Input
                                    required
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="bg-black border-neutral-800 text-white rounded-none focus:ring-1 focus:ring-white h-12"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Definir Senha</label>
                                <Input
                                    required
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    className="bg-black border-neutral-800 text-white rounded-none focus:ring-1 focus:ring-white h-12"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Confirmar Senha</label>
                                <Input
                                    required
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="bg-black border-neutral-800 text-white rounded-none focus:ring-1 focus:ring-white h-12"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-white text-black hover:bg-neutral-200 rounded-none font-bold uppercase tracking-[0.2em] text-xs transition-transform active:scale-[0.99]"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    <span>Inicializar Acesso</span>
                                </div>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
