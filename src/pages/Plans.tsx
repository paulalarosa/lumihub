import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight, Shield, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import SEOHead from '@/components/seo/SEOHead'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useLanguage } from '@/hooks/useLanguage'

export default function Plans() {
  const { t } = useLanguage()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    'monthly',
  )
  const navigate = useNavigate()
  const { trackSubscription, trackCTAClick } = useAnalytics()

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

  useEffect(() => {
    trackSubscription('view_plans')
  }, [trackSubscription])

  return (
    <>
      <SEOHead
        title={t('landing.plans.seo_title')}
        description={t('landing.plans.seo_description')}
        keywords="preço sistema maquiadora, plano CRM beauty, quanto custa sistema gestão maquiagem, software maquiadora preço"
        url="https://khaoskontrol.com.br/planos"
        type="product"
        productPrice={31.92}
        productCurrency="BRL"
        productAvailability="InStock"
        breadcrumbs={[
          { name: t('SIDEBAR_DASHBOARD'), url: 'https://khaoskontrol.com.br/' },
          { name: t('header_plans'), url: 'https://khaoskontrol.com.br/planos' },
        ]}
      />

      <div className="min-h-screen bg-background text-foreground">
        <section className="pt-32 pb-8 px-6">
          <div className="container mx-auto max-w-5xl text-center">
            <motion.p
              className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {t('landing.plans.eyebrow')}
            </motion.p>

            <motion.h1
              className="text-4xl md:text-6xl font-serif text-foreground tracking-tight mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Invista menos que um{' '}
              <span className="italic text-foreground/70">jantar por mês</span>
            </motion.h1>

            <motion.p
              className="text-muted-foreground text-base max-w-xl mx-auto mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {t('landing.plans.subtitle')}
            </motion.p>

            <div className="inline-flex items-center gap-1 p-1 bg-accent/50 border border-border">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('landing.plans.monthly')}
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2.5 text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'annual'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('landing.plans.annual')}
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
                const savingsCount = (
                  (plan.monthlyPrice - plan.annualPrice) *
                  12
                ).toFixed(0)

                return (
                  <motion.div
                    key={plan.id}
                    className={`relative flex flex-col p-8 border transition-all ${
                      plan.highlighted
                        ? 'border-foreground/30 bg-accent/50 md:scale-[1.03] z-20'
                        : 'border-border bg-card z-10'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-6">
                        <span className="px-3 py-1 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest">
                          Mais escolhido
                        </span>
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-foreground mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-muted-foreground">R$</span>
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={billingCycle}
                            className="text-5xl font-serif text-foreground tracking-tight"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                          >
                            {price.toFixed(2).replace('.', ',')}
                          </motion.span>
                        </AnimatePresence>
                        <span className="text-xs text-muted-foreground">/mês</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-1">
                      {plan.valueAnchor}
                    </p>

                    {billingCycle === 'annual' && (
                      <p className="text-xs text-emerald-500 font-medium mb-6">
                        {t('landing.plans.save', { savings: savingsCount })}
                      </p>
                    )}
                    {billingCycle === 'monthly' && <div className="mb-6" />}

                    <div className="h-px bg-border mb-6" />

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              feature.highlight ? 'text-foreground' : 'text-muted-foreground/30'
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              feature.highlight ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <p className="text-[11px] text-muted-foreground/60 mb-6 italic">
                      {plan.idealFor}
                    </p>

                    <Button
                      variant={plan.highlighted ? 'primary' : 'outline'}
                      size="lg"
                      className="w-full group rounded-none"
                      onClick={() => {
                        const price =
                          billingCycle === 'monthly'
                            ? plan.monthlyPrice
                            : plan.annualPrice
                        trackSubscription('select_plan', plan.name, price)
                        trackCTAClick(
                          'plan_select',
                          'pricing_page',
                          `/cadastro?plan=${plan.id}`,
                        )
                        navigate(
                          `/cadastro?plan=${plan.id}&cycle=${billingCycle}`,
                        )
                      }}
                    >
                      {t('landing.plans.start_free')}
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
              <div className="flex items-start gap-3 p-5 border border-border">
                <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground font-medium mb-1">
                    {t('landing.plans.footer.trial')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('landing.plans.footer.trial_desc')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-5 border border-border">
                <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground font-medium mb-1">
                    {t('landing.plans.footer.cancel')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('landing.plans.footer.cancel_desc')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-5 border border-border">
                <Star className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground font-medium mb-1">
                    {t('landing.plans.footer.support')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('landing.plans.footer.support_desc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-xs text-muted-foreground">
                {t('landing.plans.social_proof')}
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

