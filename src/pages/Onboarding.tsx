import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, CheckCircle2, ArrowRight, Sparkles, Terminal } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";

const Onboarding = () => {
  const {
    step,
    setStep,
    isConnecting,
    isCompleting,
    handleConnectGoogleCalendar,
    handleComplete,
    handleSkipCalendar
  } = useOnboarding();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 overflow-hidden relative font-sans selection:bg-white selection:text-black">
      {/* Background Effects - Noise & Grid */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />

      {/* Progress Indicator - Minimalist Studio */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`h-0.5 w-8 transition-colors duration-300 ${s <= step ? 'bg-white' : 'bg-neutral-800'}`} />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Welcome (Studio Setup) */}
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
            <div className="bg-black border border-white/10 p-12 relative shadow-2xl shadow-black/50 rounded-none">
              <div className="mb-10 flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-neutral-500">Configuração do Estúdio</span>
                <Sparkles className="w-3 h-3 text-neutral-500" />
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl font-serif text-white mb-6 tracking-wide leading-tight"
              >
                KONTROL
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-neutral-400 text-lg mb-12 font-sans font-light leading-relaxed"
              >
                O backstage digital para o seu império. <br />
                <span className="text-white">Precisão. Controle. Estética.</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={() => setStep(2)}
                  className="w-full h-14 text-xs font-bold bg-white text-black hover:bg-neutral-200 rounded-none transition-all duration-300 uppercase tracking-[0.2em]"
                >
                  INICIAR IMPÉRIO
                  <ArrowRight className="ml-2 h-3 w-3" />
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
            <div className="bg-black border border-white/10 p-12 relative shadow-2xl shadow-black/50 rounded-none">
              <div className="mb-10 flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-neutral-500">Integração</span>
                <Calendar className="w-3 h-3 text-neutral-500" />
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-serif text-white mb-6 tracking-wide"
              >
                Comando de Sync
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-neutral-400 text-sm mb-10 font-sans leading-relaxed"
              >
                Integre o Google Calendar para habilitar o agendamento inteligente.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-4 mb-10"
              >
                {[
                  'Linha do Tempo Unificada',
                  'Bloqueio Automático',
                  'Sincronização com Clientes'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1 h-1 bg-white rounded-none" />
                    <span className="text-neutral-500 text-xs font-mono uppercase tracking-wider">{feature}</span>
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
                  className="w-full h-14 text-xs font-bold bg-white text-black hover:bg-neutral-200 rounded-none transition-all duration-300 uppercase tracking-[0.2em]"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      CONECTANDO...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-3 w-3" />
                      CONECTAR PROVEDOR
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleSkipCalendar}
                  className="w-full h-10 text-neutral-500 hover:text-white hover:bg-transparent text-[10px] font-mono uppercase tracking-[0.2em] rounded-none"
                >
                  PULAR CONFIGURAÇÃO
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
            <div className="bg-black border border-white/10 p-12 relative shadow-2xl shadow-black/50 rounded-none">
              <div className="mb-10 flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-neutral-500">Sistema Pronto</span>
                <CheckCircle2 className="w-3 h-3 text-neutral-500" />
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-serif text-white mb-6 tracking-wide"
              >
                Sistemas Operantes
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-neutral-400 text-sm mb-12 font-sans leading-relaxed"
              >
                Seu ambiente de estúdio foi implantado com sucesso.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={handleComplete}
                  disabled={isCompleting}
                  className="w-full h-14 text-xs font-bold bg-white text-black hover:bg-neutral-200 rounded-none transition-all duration-300 uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      FINALIZANDO...
                    </>
                  ) : (
                    <>
                      ACESSAR DASHBOARD
                      <Terminal className="ml-2 h-3 w-3" />
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
