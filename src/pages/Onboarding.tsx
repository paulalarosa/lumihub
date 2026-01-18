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
          scopes: 'https://www.googleapis.com/auth/calendar',
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
      // NOTE: 'google_calendar_connected' column does not exist in 'profiles' table,
      // so we only update 'onboarding_completed'.
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
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 overflow-hidden relative font-sans selection:bg-black selection:text-white">
      {/* Background Effects - Concrete Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] opacity-40 mix-blend-multiply" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#000000_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03]" />

      {/* Progress Indicator - Minimalist Studio */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`h-1 w-8 transition-colors duration-300 ${s <= step ? 'bg-black' : 'bg-neutral-300'}`} />
          </div>
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
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg"
          >
            <div className="bg-white border border-neutral-200 p-12 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] relative rounded-sm">
              <div className="mb-10 flex justify-between items-center border-b border-neutral-100 pb-4">
                <span className="text-xs font-bold tracking-widest uppercase text-neutral-400">Studio Setup</span>
                <Sparkles className="w-4 h-4 text-neutral-400" />
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 tracking-tight"
              >
                LUMI HUB
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-neutral-500 text-lg mb-12 font-medium leading-relaxed"
              >
                The digital backstage for your empire. <br />
                Precision. Control. Aesthetic.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={() => setStep(2)}
                  className="w-full h-14 text-sm font-bold bg-black text-white hover:bg-neutral-900 hover:text-[#D4AF37] rounded-sm transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-wider"
                >
                  Initialize
                  <ArrowRight className="ml-2 h-4 w-4" />
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
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg"
          >
            <div className="bg-white border border-neutral-200 p-12 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] relative rounded-sm">
              <div className="mb-10 flex justify-between items-center border-b border-neutral-100 pb-4">
                <span className="text-xs font-bold tracking-widest uppercase text-neutral-400">Integration</span>
                <Calendar className="w-4 h-4 text-neutral-400" />
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-neutral-900 mb-6 tracking-tight"
              >
                Sync Command
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-neutral-500 text-base mb-10 font-medium"
              >
                Integrate Google Calendar to enable intelligent scheduling.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-4 mb-10"
              >
                {[
                  'Unified Timeline',
                  'Automated Blocking',
                  'Client Synchronization'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full" />
                    <span className="text-neutral-600 text-sm font-semibold tracking-wide">{feature}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <Button
                  onClick={handleConnectGoogleCalendar}
                  disabled={isConnecting}
                  className="w-full h-14 text-sm font-bold bg-black text-white hover:bg-neutral-900 hover:text-[#D4AF37] rounded-sm transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-wider"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Connect Provider
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleSkipCalendar}
                  className="w-full h-10 text-neutral-400 hover:text-neutral-900 hover:bg-transparent text-xs font-semibold uppercase tracking-widest"
                >
                  Skip Configuration
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
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg"
          >
            <div className="bg-white border border-neutral-200 p-12 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] relative rounded-sm">
              <div className="mb-10 flex justify-between items-center border-b border-neutral-100 pb-4">
                <span className="text-xs font-bold tracking-widest uppercase text-neutral-400">System Ready</span>
                <CheckCircle2 className="w-4 h-4 text-neutral-400" />
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-neutral-900 mb-6 tracking-tight"
              >
                All Systems Go
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-neutral-500 text-lg mb-12 font-medium"
              >
                Your studio environment has been successfully deployed.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={handleComplete}
                  disabled={isCompleting}
                  className="w-full h-14 text-sm font-bold bg-black text-white hover:bg-neutral-900 hover:text-[#D4AF37] rounded-sm transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-wider"
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finalizing...
                    </>
                  ) : (
                    <>
                      Enter Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
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
