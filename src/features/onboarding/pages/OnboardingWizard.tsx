import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [businessName, setBusinessName] = useState('');
    const [financialGoal, setFinancialGoal] = useState<number | null>(null);
    const [specialty, setSpecialty] = useState<'makeup' | 'hair' | 'full' | null>(null);

    // Auto-advance step 0 (Boot)
    useEffect(() => {
        if (step === 0) {
            const timer = setTimeout(() => setStep(1), 2500);
            return () => clearTimeout(timer);
        }
    }, [step]);

    // Handlers
    const handleSaveIdentity = async () => {
        if (!businessName.trim()) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ business_name: businessName } as any)
                .eq('id', user?.id);

            if (error) throw error;
            setStep(2);
        } catch (e) {
            toast({ title: 'Erro', description: 'Falha ao salvar nome.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGoal = async () => {
        if (!financialGoal) return;
        // We might save this to a 'goals' table or 'profiles' metadata in the future.
        // For now, just advance to keep it immersive.
        setStep(3);
    };

    const handleSaveSpecialty = async (role: 'makeup' | 'hair' | 'full') => {
        setSpecialty(role);
        setLoading(true);
        // Simulate network delay for "Processing" feel
        setTimeout(async () => {
            try {
                await supabase
                    .from('profiles')
                    .update({
                        specialty: role
                    } as any) // suppress TS if column missing, handle gracefully
                    .eq('id', user?.id);
            } catch (e) {
                console.warn("Specialty column might be missing, proceeding anyway");
            }
            setLoading(false);
            setStep(4);
        }, 800);
    };

    const handleFinalize = async () => {
        setLoading(true);
        try {
            // 1. Mark onboarding as completed
            const { error } = await supabase
                .from('profiles')
                .update({ onboarding_completed: true } as any)
                .eq('id', user?.id);

            if (error) throw error;

            // 2. Play success animation then close
            setTimeout(() => {
                onComplete();
            }, 1000);

        } catch (e) {
            console.error(e);
            // If column is missing, force complete locally so user isn't stuck
            onComplete();
        } finally {
            setLoading(false);
        }
    };

    // Render Helpers
    const renderBoot = () => (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="font-mono text-green-500 text-sm mb-4 animate-pulse">
        /// SYSTEM_BOOT_SEQUENCE
            </div>
            <h1 className="font-mono text-4xl md:text-6xl text-white font-bold tracking-tighter">
                ESTABELECENDO<br />CONEXÃO SEGURA...
            </h1>
            <div className="mt-8 flex gap-1">
                <span className="w-2 h-2 bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    );

    const renderIdentity = () => (
        <div className="flex flex-col h-full justify-center max-w-2xl mx-auto w-full">
            <h2 className="font-serif text-3xl md:text-5xl text-white mb-12 leading-tight">
                Qual o nome do <br /> <span className="text-gray-500">seu negócio?</span>
            </h2>
            <input
                autoFocus
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="EX: SILVA BEAUTY STUDIO"
                className="bg-transparent border-b-2 border-white/20 text-2xl md:text-4xl text-white font-mono placeholder:text-white/10 focus:outline-none focus:border-white transition-colors py-4 w-full uppercase"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveIdentity()}
            />
            <div className="mt-12 flex justify-end">
                <Button
                    onClick={handleSaveIdentity}
                    disabled={!businessName || loading}
                    className="rounded-none bg-white text-black hover:bg-gray-200 text-lg px-8 py-6 uppercase font-mono tracking-widest"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'CONFIRMAR ->'}
                </Button>
            </div>
        </div>
    );

    const renderFinancial = () => (
        <div className="flex flex-col h-full justify-center max-w-3xl mx-auto w-full">
            <h2 className="font-serif text-3xl md:text-5xl text-white mb-4 leading-tight">
                Qual sua meta de <br /> <span className="text-gray-500">faturamento mensal?</span>
            </h2>
            <p className="font-mono text-white/40 text-sm mb-12 uppercase tracking-widest">
                VAMOS CONFIGURAR SEUS GRÁFICOS PARA ESTE ALVO.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[5000, 10000, 20000].map((val) => (
                    <button
                        key={val}
                        onClick={() => { setFinancialGoal(val); setStep(3); }}
                        className={cn(
                            "p-8 border border-white/20 text-left hover:bg-white hover:text-black transition-all group",
                            financialGoal === val ? "bg-white text-black" : "bg-black text-white"
                        )}
                    >
                        <span className="block font-mono text-xs uppercase tracking-widest mb-2 opacity-60 group-hover:opacity-100">Meta</span>
                        <span className="block font-serif text-3xl md:text-4xl">
                            R$ {val / 1000}k
                        </span>
                    </button>
                ))}
                <button
                    onClick={() => { setFinancialGoal(0); setStep(3); }}
                    className="p-8 border border-white/20 text-left hover:bg-white hover:text-black transition-all group flex flex-col justify-end"
                >
                    <span className="block font-serif text-xl">OUTRO VALOR</span>
                </button>
            </div>
        </div>
    );

    const renderRole = () => (
        <div className="flex flex-col h-full justify-center max-w-3xl mx-auto w-full">
            <h2 className="font-serif text-3xl md:text-5xl text-white mb-12 leading-tight">
                Qual seu <span className="text-gray-500">foco principal?</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { id: 'makeup', label: 'MAQUIAGEM' },
                    { id: 'hair', label: 'PENTEADO' },
                    { id: 'full', label: 'COMPLETO' }
                ].map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => handleSaveSpecialty(opt.id as any)}
                        className="aspect-square border border-white/20 hover:bg-white hover:text-black transition-all flex flex-col items-center justify-center gap-4 group"
                    >
                        <div className="w-3 h-3 bg-white/40 rounded-none group-hover:bg-black" />
                        <span className="font-mono text-lg uppercase tracking-widest">{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderCompletion = () => (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-8">
                <Check className="w-16 h-16 text-white mx-auto mb-4 border border-white p-2" />
                <p className="font-mono text-white/50 text-sm uppercase tracking-widest">SETUP_COMPLETE</p>
            </div>

            <h1 className="font-serif text-4xl md:text-6xl text-white mb-8">
                Bem-vinda, <br /> {user?.user_metadata?.full_name?.split(' ')[0]}
            </h1>

            <Button
                onClick={handleFinalize}
                disabled={loading}
                className="bg-white text-black hover:bg-gray-200 rounded-none px-10 py-8 text-lg font-mono uppercase tracking-widest animate-pulse"
            >
                {loading ? 'INICIALIZANDO...' : 'ACESSAR TERMINAL'}
            </Button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] bg-black text-white px-6 font-sans selection:bg-white selection:text-black">
            {/* Background Texture */}
            <div className="absolute inset-0 z-0 bg-noise opacity-30 pointer-events-none" />

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-white/10 z-20">
                <motion.div
                    className="h-full bg-white"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(step / 4) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <div className="relative z-10 h-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                        transition={{ duration: 0.4 }}
                        className="h-full"
                    >
                        {step === 0 && renderBoot()}
                        {step === 1 && renderIdentity()}
                        {step === 2 && renderFinancial()}
                        {step === 3 && renderRole()}
                        {step === 4 && renderCompletion()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
