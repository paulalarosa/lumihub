import { useNavigate } from 'react-router-dom';
import { useInviteLanding } from '@/hooks/useInviteLanding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, ShieldCheck, UserPlus } from 'lucide-react';

export default function InviteLanding() {
    const navigate = useNavigate();
    const {
        status,
        inviteData,
        loading,
        formData,
        setFormData,
        handleRegister
    } = useInviteLanding();


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
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-white selection:text-black">
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
                            KONTROL
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
                                <label htmlFor="invite-name" className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Nome Completo</label>
                                <Input
                                    id="invite-name"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                    className="bg-black border-neutral-800 text-white rounded-none focus:ring-1 focus:ring-white h-12"
                                    placeholder="SEU NOME"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="invite-phone" className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">WhatsApp</label>
                                <Input
                                    id="invite-phone"
                                    required
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="bg-black border-neutral-800 text-white rounded-none focus:ring-1 focus:ring-white h-12"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="invite-password" className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Definir Senha</label>
                                <Input
                                    id="invite-password"
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
                                <label htmlFor="invite-confirm-password" className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Confirmar Senha</label>
                                <Input
                                    id="invite-confirm-password"
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
