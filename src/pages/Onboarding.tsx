import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Check if we returned from Google Auth
  useEffect(() => {
    if (searchParams.get('google_connected') === 'true') {
      setStep(3);
      toast.success("Google Calendar conectado!");
    }
  }, [searchParams]);

  const handleConnectGoogleCalendar = async () => {
    setIsConnecting(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.readonly',
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('Error connecting Google Calendar:', error);
        toast.error('Erro ao conectar com Google Calendar');
        setIsConnecting(false);
        return;
      }
      // Redirect is automatic
    } catch (err) {
      console.error('Connection error:', err);
      toast.error('Erro de conexão');
      setIsConnecting(false);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsCompleting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (error) {
        console.error('Error completing onboarding:', error);
        toast.error('Erro ao finalizar onboarding');
        setIsCompleting(false);
        return;
      }

      toast.success('Bem-vindo ao Lumi!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Complete error:', err);
      toast.error('Erro ao finalizar');
      setIsCompleting(false);
    }
  };

  const handleSkipCalendar = () => {
    setStep(3);
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl" />

      {/* Progress Indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2">
        {[1, 2, 3].map((s) => (
          <motion.div
            key={s}
            className={`h-1 w-12 rounded-full transition-all duration-300 ${s <= step ? 'bg-gradient-to-r from-white/80 to-white/40' : 'bg-white/10'
              }`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: s * 0.1 }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <motion.div
            key="step1"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full max-w-lg"
          >
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/10"
              >
                <Sparkles className="w-10 h-10 text-white/80" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-b from-white via-white/90 to-white/60 bg-clip-text text-transparent"
                style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}
              >
                Bem-vindo ao Lumi
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center text-white/50 text-lg mb-10"
              >
                Seu assistente inteligente para gerenciar eventos e clientes com elegância.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={() => setStep(2)}
                  className="w-full h-14 text-lg font-medium bg-white text-neutral-950 hover:bg-white/90 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  Começar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Connect Google Calendar */}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full max-w-lg"
          >
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/10"
              >
                <Calendar className="w-10 h-10 text-white/80" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-b from-white via-white/90 to-white/60 bg-clip-text text-transparent"
              >
                Ative seu Assistente
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center text-white/50 text-base mb-8"
              >
                Conecte seu Google Calendar para sincronizar automaticamente seus eventos.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-4 mb-8"
              >
                {[
                  'Sincronização automática em tempo real',
                  'Gestão inteligente de compromissos',
                  'Lembretes personalizados'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <CheckCircle2 className="w-5 h-5 text-white/60 shrink-0" />
                    <span className="text-white/70 text-sm">{feature}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <Button
                  onClick={handleConnectGoogleCalendar}
                  disabled={isConnecting}
                  className="w-full h-14 text-lg font-medium bg-white text-neutral-950 hover:bg-white/90 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-5 w-5" />
                      Conectar Google Calendar
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleSkipCalendar}
                  className="w-full h-12 text-white/40 hover:text-white/60 hover:bg-white/5 rounded-xl"
                >
                  Pular por agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <motion.div
            key="step3"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full max-w-lg"
          >
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/10"
              >
                <CheckCircle2 className="w-10 h-10 text-white/80" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-b from-white via-white/90 to-white/60 bg-clip-text text-transparent"
              >
                Tudo Pronto!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center text-white/50 text-lg mb-10"
              >
                Seu ambiente está configurado. Vamos começar?
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={handleComplete}
                  disabled={isCompleting}
                  className="w-full h-14 text-lg font-medium bg-white text-neutral-950 hover:bg-white/90 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      Acessar Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
