import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles, Zap, Rocket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

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

export const PricingCards = ({
  billingCycle,
}: {
  billingCycle: 'monthly' | 'annual'
}) => {
  const navigate = useNavigate()

  return (
    <section className="py-20 px-6 relative z-10">
      <div className="container mx-auto max-w-7xl">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => {
            const price =
              billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice
            const savings = (
              (plan.monthlyPrice - plan.annualPrice) *
              12
            ).toFixed(2)

            return (
              <motion.div
                key={plan.id}
                className={`
                  relative p-10 card transition-all duration-500
                  ${
                    plan.highlighted
                      ? 'border-white/30 shadow-2xl shadow-white/5 md:scale-105 z-20 bg-white/[0.05]'
                      : 'border-white/10 z-10'
                  }
                `}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Highlighted Badge */}
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
                    <div className="px-5 py-1.5 bg-white text-black text-[10px] font-bold rounded-full shadow-2xl uppercase tracking-widest font-mono">
                      MAIS POPULAR
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
                  <plan.icon className="w-7 h-7 text-white opacity-80" />
                </div>

                {/* Header */}
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  {plan.name}
                </h3>
                <p className="text-white/40 text-[10px] font-mono uppercase tracking-[0.25em] mb-10">
                  {plan.subtitle}
                </p>

                {/* Price */}
                <div className="mb-10">
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-white/30 text-base font-serif italic">
                      R$
                    </span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={billingCycle}
                        className="text-6xl font-bold text-white tracking-tighter"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                      >
                        {price.toFixed(2).replace('.', ',')}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-white/30 text-xs font-mono tracking-widest uppercase ml-1">
                      /MÊS
                    </span>
                  </div>

                  {billingCycle === 'annual' && (
                    <motion.p
                      className="text-green-400 text-[10px] font-mono uppercase tracking-wider"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      [Economize R$ {savings}/ano]
                    </motion.p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-12 border-t border-white/5 pt-10">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-4">
                      <Check className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                      <span className="text-white/70 text-sm tracking-wide">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  variant={plan.highlighted ? 'primary' : 'glass'}
                  size="lg"
                  className="w-full tracking-widest uppercase font-bold text-xs"
                  onClick={() =>
                    navigate(`/cadastro?plan=${plan.id}&cycle=${billingCycle}`)
                  }
                >
                  COMEÇAR_SISTEMA
                </Button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
