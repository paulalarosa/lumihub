import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight, Shield, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import SEOHead from '@/components/seo/SEOHead'

const plans = [
  {
    id: 'essencial',
    name: 'Essencial',
    tagline: 'Para quem está começando a profissionalizar',
    monthlyPrice: 39.9,
    annualPrice: 31.92,
    valueAnchor: 'Menos que um almoço por semana',
    features: [
      { text: 'Até 10 clientes ativos', highlight: false },
      { text: 'Agenda integrada com Google Calendar', highlight: false },
      { text: 'Contratos digitais com assinatura', highlight: true },
      { text: 'Portal exclusivo para cada noiva', highlight: true },
      { text: 'Relatório financeiro básico', highlight: false },
    ],
    idealFor: 'Ideal se você atende até 10 noivas por mês',
  },
  {
    id: 'profissional',
    name: 'Profissional',
    tagline: 'Para quem já vive de maquiagem e quer escalar',
    monthlyPrice: 89.9,
    annualPrice: 71.92,
    valueAnchor: 'Paga-se com 1 cliente extra por mês',
    highlighted: true,
    features: [
      { text: 'Clientes ilimitados', highlight: true },
      { text: 'Tudo do Essencial +', highlight: false },
      { text: 'Analytics completo de faturamento', highlight: false },
      { text: 'Portal da noiva personalizado', highlight: true },
      { text: 'Moodboard interativo', highlight: false },
      { text: 'Fichas de anamnese digital', highlight: false },
      { text: 'Follow-up automático por WhatsApp', highlight: true },
    ],
    idealFor: 'Ideal se você fatura acima de R$5k/mês',
  },
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'Para equipes e quem tem assistentes',
    monthlyPrice: 149.9,
    annualPrice: 119.92,
    valueAnchor: 'O custo de 1 hora de trabalho por mês',
    features: [
      { text: 'Tudo do Profissional +', highlight: false },
      { text: 'Gestão de equipe completa', highlight: true },
      { text: 'Comissões automáticas por evento', highlight: true },
      { text: 'Dashboard de performance por artista', highlight: false },
      { text: 'Acesso multi-usuário', highlight: true },
      { text: 'IA para sugestões operacionais', highlight: false },
      { text: 'Suporte prioritário', highlight: false },
      { text: 'Integração via API', highlight: false },
    ],
    idealFor: 'Ideal se você tem 2+ assistentes ou é studio',
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
        title="Planos e Preços"
        description="Escolha o plano ideal para organizar sua carreira de maquiagem. A partir de R$31,92/mês. Essencial, Profissional ou Studio. 14 dias grátis."
        keywords="preço sistema maquiadora, plano CRM beauty, quanto custa sistema gestão maquiagem, software maquiadora preço"
        url="https://khaoskontrol.com.br/planos"
        type="product"
        productPrice={31.92}
        productCurrency="BRL"
        productAvailability="InStock"
        breadcrumbs={[
          { name: 'Início', url: 'https://khaoskontrol.com.br/' },
          { name: 'Planos', url: 'https://khaoskontrol.com.br/planos' },
        ]}
      />

      <div className="min-h-screen bg-black text-white">
        <section className="pt-32 pb-8 px-6">
          <div className="container mx-auto max-w-5xl text-center">
            <motion.p
              className="text-xs text-white/40 uppercase tracking-[0.2em] mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Quanto custa continuar desorganizada?
            </motion.p>

            <motion.h1
              className="text-4xl md:text-6xl font-serif text-white tracking-tight mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Invista menos que um{' '}
              <span className="italic text-white/70">jantar por mês</span>
            </motion.h1>

            <motion.p
              className="text-white/40 text-base max-w-xl mx-auto mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Cada cliente esquecido, cada contrato perdido, cada follow-up não
              enviado custa mais do que qualquer plano abaixo.
            </motion.p>

            <div className="inline-flex items-center gap-1 p-1 bg-white/5 border border-white/10">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2.5 text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'annual'
                    ? 'bg-white text-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Anual
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 font-bold uppercase tracking-wider">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              {plans.map((plan, index) => {
                const price =
                  billingCycle === 'monthly'
                    ? plan.monthlyPrice
                    : plan.annualPrice
                const savings = (
                  (plan.monthlyPrice - plan.annualPrice) *
                  12
                ).toFixed(0)

                return (
                  <motion.div
                    key={plan.id}
                    className={`relative flex flex-col p-8 border transition-all ${
                      plan.highlighted
                        ? 'border-white/30 bg-white/[0.04] md:scale-[1.03] z-20'
                        : 'border-white/10 bg-white/[0.02] z-10'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-6">
                        <span className="px-3 py-1 bg-white text-black text-[10px] font-bold uppercase tracking-widest">
                          Mais escolhido
                        </span>
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-white/40">{plan.tagline}</p>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-white/40">R$</span>
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={billingCycle}
                            className="text-5xl font-serif text-white tracking-tight"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                          >
                            {price.toFixed(2).replace('.', ',')}
                          </motion.span>
                        </AnimatePresence>
                        <span className="text-xs text-white/30">/mês</span>
                      </div>
                    </div>

                    <p className="text-xs text-white/30 mb-1">
                      {plan.valueAnchor}
                    </p>

                    {billingCycle === 'annual' && (
                      <p className="text-xs text-emerald-400 font-medium mb-6">
                        Economize R$ {savings}/ano
                      </p>
                    )}
                    {billingCycle === 'monthly' && <div className="mb-6" />}

                    <div className="h-px bg-white/10 mb-6" />

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              feature.highlight ? 'text-white' : 'text-white/30'
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              feature.highlight ? 'text-white' : 'text-white/50'
                            }`}
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <p className="text-[11px] text-white/25 mb-6 italic">
                      {plan.idealFor}
                    </p>

                    <Button
                      variant={plan.highlighted ? 'primary' : 'glass'}
                      size="lg"
                      className="w-full group"
                      onClick={() =>
                        navigate(
                          `/cadastro?plan=${plan.id}&cycle=${billingCycle}`,
                        )
                      }
                    >
                      Começar 14 dias grátis
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-start gap-3 p-5 border border-white/[0.06]">
                <Shield className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white font-medium mb-1">
                    14 dias grátis
                  </p>
                  <p className="text-xs text-white/30">
                    Teste tudo sem compromisso. Sem cartão de crédito.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-5 border border-white/[0.06]">
                <Clock className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white font-medium mb-1">
                    Cancele quando quiser
                  </p>
                  <p className="text-xs text-white/30">
                    Sem multa, sem burocracia. 2 cliques e pronto.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-5 border border-white/[0.06]">
                <Star className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white font-medium mb-1">
                    Suporte humano
                  </p>
                  <p className="text-xs text-white/30">
                    Não é chatbot. Fale com quem entende do mercado.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-xs text-white/20">
                Mais de 200 profissionais já organizam sua carreira com o Khaos
                Kontrol.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
