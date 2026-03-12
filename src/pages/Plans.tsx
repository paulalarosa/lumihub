import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles, Zap, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import SEOHead from '@/components/seo/SEOHead'
import { SectionHeader } from '@/components/ui/SectionHeader'

const plans = [
  {
    id: 'essencial',
    name: 'ACESSO ESSENCIAL',
    subtitle: 'ACESSO SISTEMA NÍVEL 1',
    monthlyPrice: 39.9,
    annualPrice: 31.92,
    icon: Sparkles,
    features: [
      '10 CLIENTES ATIVOS',
      'PACK TÉCNICO BÁSICO (PDF)',
      'AGENDA INTELIGENTE',
      'CONTRATOS DIGITAIS',
      'PORTAL DA CLIENTE',
    ],
  },
  {
    id: 'profissional',
    name: 'ACESSO PROFISSIONAL',
    subtitle: 'SUÍTE DE GESTÃO AVANÇADA',
    monthlyPrice: 89.9,
    annualPrice: 71.92,
    icon: Zap,
    features: [
      'CLIENTES ILIMITADOS',
      'PACK TÉCNICO GOLD',
      'ANALYTICS COMPLETO',
      'PORTAL DA NOIVA CUSTOM',
      'MOODBOARD INTERATIVO',
      'FICHAS DE ANAMNESE',
    ],
    highlighted: true,
  },
  {
    id: 'studio',
    name: 'ACESSO STUDIO',
    subtitle: 'SOLUÇÕES PARA EQUIPES & IMPÉRIOS',
    monthlyPrice: 149.9,
    annualPrice: 119.92,
    icon: Rocket,
    features: [
      'TUDO DO PRO',
      'GESTÃO DE EQUIPE',
      'AUTO COMISSÕES',
      'IA OPERACIONAL',
      'PERFORMANCE DO ARTISTA',
      'ACESSO MULTI-USUÁRIO',
      'SUPORTE PRIORITÁRIO',
      'INTEGRAÇÃO API',
    ],
  },
]

export default function Plans() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    'monthly',
  )
  const navigate = useNavigate()

  return (
    <>
      <SEOHead
        title="Planos & Assinaturas | KHAOS KONTROL"
        description="Escolha o plano ideal para sua carreira. Gestão completa, contratos digitais e portal do cliente em uma experiência premium."
      />

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/[0.02] blur-[180px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-white/[0.015] blur-[180px] rounded-full pointer-events-none" />

        <section className="pt-40 pb-12 px-6 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <SectionHeader title="PLANOS" />

            <div className="flex justify-start mt-12 w-full">
              <div className="inline-flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-black shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                    billingCycle === 'annual'
                      ? 'bg-white text-black shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Anual
                  <span className="px-2 py-1 bg-green-500 text-white text-[10px] uppercase font-bold tracking-widest rounded-full">
                    -20%
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 relative z-10">
          <div className="container mx-auto max-w-7xl">
            <div className="grid md:grid-cols-3 gap-8 items-start">
              {plans.map((plan, index) => {
                const Icon = plan.icon
                const price =
                  billingCycle === 'monthly'
                    ? plan.monthlyPrice
                    : plan.annualPrice
                const savings = (
                  (plan.monthlyPrice - plan.annualPrice) *
                  12
                ).toFixed(2)

                return (
                  <motion.div
                    key={plan.id}
                    className={`
                      relative p-10 rounded-[2.5rem] backdrop-blur-3xl
                      bg-white/[0.03] border transition-all duration-300
                      hover:bg-white/[0.06] hover:scale-[1.02]
                      ${
                        plan.highlighted
                          ? 'border-white/30 shadow-[0_20px_80px_rgba(255,255,255,0.05)] md:scale-105 z-20'
                          : 'border-white/10 shadow-xl shadow-black/20 z-10'
                      }
                    `}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-[2.5rem] pointer-events-none" />

                    {plan.highlighted && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
                        <div className="px-4 py-1.5 bg-white text-black text-[10px] tracking-widest font-bold uppercase rounded-full shadow-lg">
                          MAIS POPULAR
                        </div>
                      </div>
                    )}

                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/20 to-transparent p-0.5 mb-6">
                        <div className="w-full h-full bg-black/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-white/40 text-[10px] font-mono uppercase tracking-[0.2em] mb-8 min-h-[30px]">
                        {plan.subtitle}
                      </p>

                      <div className="mb-8">
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-white/40 text-sm">R$</span>
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={billingCycle}
                              className="text-6xl font-serif text-white tracking-tight"
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                            >
                              {price.toFixed(2).replace('.', ',')}
                            </motion.span>
                          </AnimatePresence>
                          <span className="text-white/40 text-[10px] tracking-widest uppercase ml-1">
                            /MÊS
                          </span>
                        </div>

                        {billingCycle === 'annual' && (
                          <div className="h-6">
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-emerald-400 text-[10px] uppercase tracking-widest font-mono font-bold bg-emerald-400/10 inline-block px-3 py-1 rounded-full"
                            >
                              ECONOMIZE R$ {savings}/ANO
                            </motion.p>
                          </div>
                        )}
                        {billingCycle === 'monthly' && <div className="h-6" />}
                      </div>

                      <div className="h-[1px] w-full bg-white/10 mb-8" />

                      <ul className="space-y-4 mb-10">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-white/70 text-sm tracking-wide">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        variant={plan.highlighted ? 'primary' : 'glass'}
                        size="lg"
                        className="w-full h-14 rounded-full font-bold uppercase tracking-widest text-xs"
                        onClick={() =>
                          navigate(
                            `/cadastro?plan=${plan.id}&cycle=${billingCycle}`,
                          )
                        }
                      >
                        COMEÇAR AGORA
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
