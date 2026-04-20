import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight, Shield, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link, useNavigate } from 'react-router-dom'
import SEOHead from '@/components/seo/SEOHead'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useLanguage } from '@/hooks/useLanguage'

export default function Plans() {
  const { t } = useLanguage()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const navigate = useNavigate()
  const { trackSubscription, trackCTAClick } = useAnalytics()

  const plans = [
    {
      id: 'essencial',
      name: 'Essencial',
      tagline: 'Para quem está começando a profissionalizar',
      monthlyPrice: 49.9,
      annualPrice: 39.92,
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
      monthlyPrice: 99.9,
      annualPrice: 79.92,
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
      monthlyPrice: 199.9,
      annualPrice: 159.92,
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

  useEffect(() => {
    trackSubscription('view_plans')
  }, [trackSubscription])

  return (
    <>
      <SEOHead
        title={t('plans.seo_title')}
        description={t('plans.seo_description')}
        keywords="preço sistema maquiadora, plano CRM beauty, quanto custa sistema gestão maquiagem, software maquiadora preço"
        url="https://khaoskontrol.com.br/planos"
        type="product"
        productPrice={39.92}
        productCurrency="BRL"
        productAvailability="InStock"
        breadcrumbs={[
          { name: t('SIDEBAR_DASHBOARD'), url: 'https://khaoskontrol.com.br/' },
          { name: t('header_plans'), url: 'https://khaoskontrol.com.br/planos' },
        ]}
      />

      <div className="min-h-screen bg-black text-white relative overflow-hidden">

        <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay pointer-events-none">
          <img
            src="/khaos-uploads/734febb0-c2fc-4623-98e2-bbe5a386408f.png"
            alt=""
            className="w-full h-full object-cover grayscale brightness-50"
          />
        </div>

        <div className="fixed top-[-15%] right-[-10%] w-[40%] h-[40%] bg-white/[0.015] blur-[180px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-15%] left-[-10%] w-[35%] h-[35%] bg-white/[0.01] blur-[180px] rounded-full pointer-events-none" />

        <section className="relative z-10 pt-28 sm:pt-36 md:pt-44 pb-10 px-6">
          <div className="container mx-auto max-w-5xl text-center">
            <motion.p
              className="text-xs text-white/40 uppercase tracking-[0.2em] mb-4 font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {t('plans.eyebrow')}
            </motion.p>

            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl font-serif text-white tracking-tight mb-4 leading-[1.05]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {t('plans.title')}
            </motion.h1>

            <motion.p
              className="text-white/50 text-base max-w-xl mx-auto mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {t('plans.subtitle')}
            </motion.p>

            <div
              className="inline-flex items-center gap-1 p-1 bg-white/[0.04] border border-white/10"
              role="group"
              aria-label={t('plans.billing_cycle_group', {
                defaultValue: 'Ciclo de cobrança',
              })}
            >
              <button
                type="button"
                aria-pressed={billingCycle === 'monthly'}
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2.5 text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {t('plans.monthly')}
              </button>
              <button
                type="button"
                aria-pressed={billingCycle === 'annual'}
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2.5 text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'annual'
                    ? 'bg-white text-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {t('plans.annual')}
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 font-bold uppercase tracking-wider">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="relative z-10 py-12 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {plans.map((plan, index) => {
                const price =
                  billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice
                const savingsCount = ((plan.monthlyPrice - plan.annualPrice) * 12).toFixed(0)

                return (
                  <motion.div
                    key={plan.id}
                    className={`relative flex flex-col p-6 sm:p-8 border transition-all ${
                      plan.highlighted
                        ? 'border-white/30 bg-white/[0.06] md:scale-[1.03] z-20'
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
                          {t('plans.most_chosen')}
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
                        <span className="text-xs text-white/40">/mês</span>
                      </div>
                    </div>

                    <p className="text-xs text-white/40 mb-1">{plan.valueAnchor}</p>

                    {billingCycle === 'annual' && (
                      <p className="text-xs text-emerald-400 font-medium mb-6">
                        {t('plans.save', { savings: savingsCount })}
                      </p>
                    )}
                    {billingCycle === 'monthly' && <div className="mb-6" />}

                    <div className="h-px bg-white/10 mb-6" />

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              feature.highlight ? 'text-white' : 'text-white/20'
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

                    <p className="text-[11px] text-white/30 mb-6 italic">{plan.idealFor}</p>

                    <Button
                      variant={plan.highlighted ? 'primary' : 'outline'}
                      size="lg"
                      className="w-full group rounded-none"
                      onClick={() => {
                        const p = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice
                        trackSubscription('select_plan', plan.name, p)
                        trackCTAClick('plan_select', 'pricing_page', `/cadastro?plan=${plan.id}`)
                        navigate(`/cadastro?plan=${plan.id}&cycle=${billingCycle}`)
                      }}
                    >
                      {t('plans.start_free')}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="relative z-10 py-16 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { icon: Shield, title: t('plans.footer.trial'), desc: t('plans.footer.trial_desc') },
                { icon: Clock, title: t('plans.footer.cancel'), desc: t('plans.footer.cancel_desc') },
                { icon: Star, title: t('plans.footer.support'), desc: t('plans.footer.support_desc') },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-5 border border-white/10 bg-white/[0.02]">
                  <Icon className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white font-medium mb-1">{title}</p>
                    <p className="text-xs text-white/40">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-xs text-white/30">{t('plans.social_proof')}</p>
              <div className="mt-6">
                <Link to="/contato">
                  <Button
                    variant="outline"
                    className="border-white/10 text-white hover:bg-white hover:text-black rounded-none text-xs uppercase tracking-widest"
                  >
                    Dúvidas? Fale conosco
                    <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
