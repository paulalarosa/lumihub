import { useState, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Clock,
  Loader2,
  Lock,
  Shield,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import SEOHead from '@/components/seo/SEOHead'
import { NoirLayout } from '@/components/noir/NoirLayout'
import { NoirGrain } from '@/components/noir/NoirGrain'
import { BigTextBackdrop } from '@/components/noir/BigTextBackdrop'
import { SplitText } from '@/components/noir/SplitText'
import { TiltCard } from '@/components/noir/TiltCard'
import { MagneticButton } from '@/components/noir/MagneticButton'
import { useNoirScroll } from '@/hooks/useNoirScroll'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useLanguage } from '@/hooks/useLanguage'
import { useAuth } from '@/hooks/useAuth'
import { usePlanAccess } from '@/hooks/usePlanAccess'

// 3D orb lazy: Three.js só carrega quando hidrata client-side. Evita
// quebrar prerender (Puppeteer sem WebGL) e mantém initial bundle leve.
const NoirOrb = lazy(() =>
  import('@/components/noir/NoirOrb').then((m) => ({ default: m.NoirOrb })),
)

type BillingCycle = 'monthly' | 'annual'

interface Plan {
  id: string
  name: string
  tagline: string
  monthlyPrice: number
  annualPrice: number
  valueAnchor: string
  cta: string
  ctaSub: string
  highlighted?: boolean
  features: { text: string; highlight: boolean }[]
  idealFor: string
}

const PLANS: Plan[] = [
  {
    id: 'essencial',
    name: 'Essencial',
    tagline: 'Para quem está começando a profissionalizar',
    monthlyPrice: 39.9,
    annualPrice: 31.92,
    valueAnchor: 'Menos que um almoço por semana',
    cta: 'Profissionalizar minha agenda',
    ctaSub: '14 dias grátis · sem cartão · cancele em 2 cliques',
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
    cta: 'Quero faturar mais este mês',
    ctaSub: '14 dias grátis · upgrade automático quando crescer',
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
    cta: 'Liderar minha equipe agora',
    ctaSub: '14 dias grátis · suporte prioritário desde o dia 1',
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

const EASE_NOIR = [0.16, 1, 0.3, 1] as const

export default function Plans() {
  const { t } = useLanguage()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const navigate = useNavigate()
  const { trackSubscription, trackCTAClick } = useAnalytics()
  const { user } = useAuth()
  const { createCheckoutSession } = usePlanAccess()
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const pending = localStorage.getItem('pending_checkout_plan')
    if (!pending) return
    if (pendingPlanId || createCheckoutSession.isPending) return
    const pendingCycle =
      (localStorage.getItem('pending_checkout_cycle') as BillingCycle | null) ??
      'monthly'
    localStorage.removeItem('pending_checkout_plan')
    localStorage.removeItem('pending_checkout_cycle')
    setPendingPlanId(pending)
    createCheckoutSession.mutate(
      { planType: pending, cycle: pendingCycle },
      { onSettled: () => setPendingPlanId(null) },
    )
  }, [user, createCheckoutSession, pendingPlanId])

  useEffect(() => {
    trackSubscription('view_plans')
  }, [trackSubscription])

  // GSAP ScrollTrigger pra big-text drift + fade-up reveals
  useNoirScroll([])

  const handleSelectPlan = (plan: Plan) => {
    const price =
      billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice
    trackSubscription('select_plan', plan.name, price)
    trackCTAClick(
      'plan_select',
      'pricing_page',
      user ? 'checkout' : `/cadastro?plan=${plan.id}`,
    )
    if (user) {
      setPendingPlanId(plan.id)
      createCheckoutSession.mutate(
        { planType: plan.id, cycle: billingCycle },
        { onSettled: () => setPendingPlanId(null) },
      )
    } else {
      navigate(`/cadastro?plan=${plan.id}&cycle=${billingCycle}`)
    }
  }

  return (
    <>
      <SEOHead
        title={t('plans.seo_title')}
        description={t('plans.seo_description')}
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

      <NoirLayout>
        {/* Orb 3D blob orgânico, absolute top-right, behind tudo, lazy */}
        <Suspense fallback={null}>
          <div
            aria-hidden
            className="pointer-events-none absolute top-[-15%] right-[-20%] w-[80vw] h-[80vw] max-w-[900px] max-h-[900px] z-[3]"
            style={{
              filter: 'blur(40px)',
              opacity: 0.55,
              maskImage:
                'radial-gradient(circle at center, black 40%, transparent 75%)',
              WebkitMaskImage:
                'radial-gradient(circle at center, black 40%, transparent 75%)',
            }}
          >
            <NoirOrb />
          </div>
        </Suspense>

        <HeroSection
          billingCycle={billingCycle}
          onChangeCycle={setBillingCycle}
        />

        <PlanCardsSection
          billingCycle={billingCycle}
          pendingPlanId={pendingPlanId}
          isPending={createCheckoutSession.isPending}
          onSelect={handleSelectPlan}
        />

        <StatsBar />

        <FAQSection />

        <FinalCTA />
      </NoirLayout>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────────────

interface HeroSectionProps {
  billingCycle: BillingCycle
  onChangeCycle: (c: BillingCycle) => void
}

function HeroSection({ billingCycle, onChangeCycle }: HeroSectionProps) {
  const { t } = useLanguage()

  return (
    <section className="relative pt-28 sm:pt-36 md:pt-44 pb-10 px-6 overflow-hidden">
      {/* Big text "Pricing" no fundo do hero — drift horizontal no scroll */}
      <div data-noir-drift="-180" className="absolute inset-x-0 top-0">
        <BigTextBackdrop
          text="Pricing"
          size={26}
          anchor={5}
          opacity={0.18}
          italic={false}
        />
      </div>

      <div className="container mx-auto max-w-5xl text-center relative z-10">
        <motion.p
          className="text-[10px] text-white/45 uppercase tracking-[0.3em] mb-5 font-mono"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_NOIR }}
        >
          {t('plans.eyebrow')}
        </motion.p>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white tracking-tight mb-6 leading-[1.05]">
          <SplitText
            text={t('plans.title')}
            stagger={0.05}
            delay={0.1}
            italic
          />
        </h1>

        <motion.p
          className="text-white/55 text-base md:text-lg max-w-xl mx-auto mb-12 font-light leading-relaxed"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: EASE_NOIR }}
        >
          {t('plans.subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85, ease: EASE_NOIR }}
        >
          <BillingToggle value={billingCycle} onChange={onChangeCycle} />
        </motion.div>
      </div>
    </section>
  )
}

interface BillingToggleProps {
  value: BillingCycle
  onChange: (c: BillingCycle) => void
}

function BillingToggle({ value, onChange }: BillingToggleProps) {
  const { t } = useLanguage()
  const isAnnual = value === 'annual'

  return (
    <div
      role="group"
      aria-label="Ciclo de cobrança"
      className="relative inline-flex items-center gap-1 p-1 bg-white/[0.03] border border-white/10 backdrop-blur-sm"
    >
      <button
        type="button"
        aria-pressed={!isAnnual}
        onClick={() => onChange('monthly')}
        className={`relative px-6 py-2.5 text-xs font-mono uppercase tracking-widest transition-colors duration-300 z-10 ${
          !isAnnual ? 'text-black' : 'text-white/55 hover:text-white/80'
        }`}
      >
        {!isAnnual && (
          <motion.div
            layoutId="cycle-pill"
            className="absolute inset-0 bg-white"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative">{t('plans.monthly')}</span>
      </button>

      <button
        type="button"
        aria-pressed={isAnnual}
        onClick={() => onChange('annual')}
        className={`relative px-6 py-2.5 text-xs font-mono uppercase tracking-widest transition-colors duration-300 z-10 flex items-center gap-2.5 ${
          isAnnual ? 'text-black' : 'text-white/55 hover:text-white/80'
        }`}
      >
        {isAnnual && (
          <motion.div
            layoutId="cycle-pill"
            className="absolute inset-0 bg-white"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative">{t('plans.annual')}</span>
        <span
          className={`relative text-[9px] font-bold tracking-widest border px-1.5 py-0.5 ${
            isAnnual ? 'border-black/30 text-black' : 'border-white/25 text-white/65'
          }`}
        >
          −20%
        </span>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Cards
// ─────────────────────────────────────────────────────────────────────────────

interface PlanCardsSectionProps {
  billingCycle: BillingCycle
  pendingPlanId: string | null
  isPending: boolean
  onSelect: (plan: Plan) => void
}

function PlanCardsSection({
  billingCycle,
  pendingPlanId,
  isPending,
  onSelect,
}: PlanCardsSectionProps) {
  return (
    <section className="relative py-12 px-0 md:px-6 overflow-hidden">
      {/* Big text "Planos" gigante atrás dos cards — drift positivo (oposto do hero) */}
      <div data-noir-drift="220" className="absolute inset-x-0 top-0">
        <BigTextBackdrop text="Planos" size={22} anchor={5} opacity={0.16} />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <p className="md:hidden text-center text-[10px] font-mono uppercase tracking-widest text-white/30 mb-4 px-6">
          Arraste para comparar os planos →
        </p>
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-6 pb-6 md:grid md:grid-cols-3 md:gap-5 md:px-0 md:pb-0 md:overflow-visible items-stretch scrollbar-thin">
          {PLANS.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              index={index}
              isPending={pendingPlanId === plan.id || isPending}
              showLoadingOnThis={pendingPlanId === plan.id}
              onSelect={() => onSelect(plan)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface PlanCardProps {
  plan: Plan
  billingCycle: BillingCycle
  index: number
  isPending: boolean
  showLoadingOnThis: boolean
  onSelect: () => void
}

function PlanCard({
  plan,
  billingCycle,
  index,
  isPending,
  showLoadingOnThis,
  onSelect,
}: PlanCardProps) {
  const { t } = useLanguage()
  const price =
    billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice
  const annualSavings = ((plan.monthlyPrice - plan.annualPrice) * 12).toFixed(0)

  return (
    <motion.div
      className="snap-center flex-shrink-0 w-[85vw] max-w-[340px] md:w-auto md:max-w-none md:flex-shrink"
      initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: index * 0.12, duration: 0.9, ease: EASE_NOIR }}
    >
      <TiltCard
        intensity={4}
        glow
        className={`group relative flex flex-col overflow-hidden border h-full ${
          plan.highlighted
            ? 'border-white/40 bg-white/[0.06] md:scale-[1.04] z-20'
            : 'border-white/10 bg-white/[0.025] hover:border-white/30 transition-colors duration-500 z-10'
        }`}
      >
        {/* Border pulse pro card highlighted */}
        {plan.highlighted && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 border border-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.15, 0.45, 0.15] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Glow direcional sup-esquerdo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-1/3 -left-1/4 w-2/3 h-2/3 rounded-full"
          style={{
            background: plan.highlighted
              ? 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 60%)'
              : 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 65%)',
            filter: 'blur(70px)',
          }}
        />

        {/* Glow inf-direito (contra-ponto) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-1/3 -right-1/4 w-1/2 h-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Grain local */}
        <NoirGrain opacity={0.25} baseFrequency={0.85} animated={false} scope="local" />

        {plan.highlighted && (
          <div className="absolute -top-3 left-6 z-30">
            <span className="px-3 py-1 bg-white text-black text-[9px] font-bold uppercase tracking-[0.25em]">
              {t('plans.most_chosen')}
            </span>
          </div>
        )}

        <div className="relative z-10 flex flex-col h-full p-6 sm:p-8" style={{ transform: 'translateZ(20px)' }}>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-1 tracking-tight">
              {plan.name}
            </h3>
            <p className="text-xs text-white/45 leading-relaxed">{plan.tagline}</p>
          </div>

          <div className="mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-white/45 font-mono">R$</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={billingCycle}
                  className="text-5xl font-serif text-white tracking-tight"
                  initial={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                  transition={{ duration: 0.35, ease: EASE_NOIR }}
                >
                  {price.toFixed(2).replace('.', ',')}
                </motion.span>
              </AnimatePresence>
              <span className="text-xs text-white/45 font-mono">/mês</span>
            </div>
          </div>

          <p className="text-xs text-white/45 mb-1 italic">{plan.valueAnchor}</p>

          {billingCycle === 'annual' ? (
            <p className="text-[10px] font-mono text-white/65 uppercase tracking-widest mb-6">
              {t('plans.save', { savings: annualSavings })}
            </p>
          ) : (
            <div className="mb-6 h-[14px]" />
          )}

          <div className="h-px bg-white/10 mb-6" />

          <ul className="space-y-3 mb-8 flex-1">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <Check
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    feature.highlight ? 'text-white' : 'text-white/30'
                  }`}
                  strokeWidth={2.5}
                />
                <span
                  className={`text-sm leading-snug ${
                    feature.highlight ? 'text-white' : 'text-white/55'
                  }`}
                >
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          <p className="text-[11px] text-white/35 mb-6 italic font-light">
            {plan.idealFor}
          </p>

          <MagneticButton strength={6} className="w-full">
            <Button
              variant={plan.highlighted ? 'primary' : 'outline'}
              size="lg"
              className="w-full group/btn rounded-none"
              disabled={isPending}
              onClick={onSelect}
            >
              {showLoadingOnThis ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Abrindo checkout...
                </>
              ) : (
                <>
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </MagneticButton>
          <p className="text-[10px] text-white/40 text-center mt-3 font-mono uppercase tracking-wider">
            {plan.ctaSub}
          </p>
        </div>
      </TiltCard>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats bar
// ─────────────────────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { value: '+200', label: 'Profissionais ativas', icon: Users },
    { value: '14 dias', label: 'Grátis · sem cartão', icon: Clock },
    { value: '2 cliques', label: 'Pra cancelar', icon: Sparkles },
    { value: 'Stripe', label: 'Pagamento seguro', icon: Lock },
  ]

  return (
    <section className="px-6 py-14 border-y border-white/[0.07]">
      <div className="container mx-auto max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {stats.map(({ value, label, icon: Icon }, idx) => (
            <motion.div
              key={label}
              className="flex items-start gap-4 md:flex-col md:items-start md:gap-2"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: idx * 0.08, duration: 0.6, ease: EASE_NOIR }}
            >
              <Icon
                className="w-5 h-5 text-white/35 mt-0.5 md:mt-0"
                strokeWidth={1.5}
              />
              <div>
                <p className="font-serif text-2xl md:text-3xl text-white tracking-tight">
                  {value}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mt-0.5">
                  {label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim. Cancelamento em 2 cliques no painel, sem multa, sem letra miúda. Sua conta permanece ativa até o fim do período já pago.',
  },
  {
    q: 'O trial de 14 dias cobra alguma coisa?',
    a: 'Não. Você não precisa nem cadastrar cartão. Se gostar, escolhe o plano e segue. Se não gostar, é só fechar a aba.',
  },
  {
    q: 'Posso mudar de plano depois?',
    a: 'A qualquer momento, pra cima ou pra baixo. Cobramos a diferença proporcional automaticamente.',
  },
  {
    q: 'Os contratos têm validade jurídica?',
    a: 'Sim. Geramos contratos com cláusulas baseadas no Código Civil + LGPD, com assinatura digital rastreável e timestamp.',
  },
  {
    q: 'Como funciona a integração com Google Calendar?',
    a: 'Sincronização bidirecional automática. Cria evento no Khaos, aparece no Google. Edita no Google, atualiza no Khaos.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Conformidade total com LGPD. Servidores no Brasil, criptografia em repouso e trânsito, exportação dos seus dados a qualquer momento. Você é dona de tudo.',
  },
  {
    q: 'Tem suporte humano?',
    a: 'Sim. WhatsApp + email com tempo de resposta médio de 4h em horário comercial. Não é chatbot — fala com pessoa que entende do mercado de beleza.',
  },
]

function FAQSection() {
  return (
    <section className="px-6 py-20 border-t border-white/[0.07]">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 mb-3">
            Perguntas frequentes
          </p>
          <h2 className="font-serif text-3xl md:text-4xl italic tracking-tight mb-3">
            Quase tudo que você quer saber
          </h2>
          <p className="text-white/50 text-sm">
            Não achou sua dúvida?{' '}
            <Link
              to="/contato"
              className="text-white underline underline-offset-4 hover:no-underline"
            >
              fale com a gente
            </Link>
            .
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {FAQ_ITEMS.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: idx * 0.05, duration: 0.5, ease: EASE_NOIR }}
            >
              <AccordionItem
                value={`item-${idx}`}
                className="border border-white/10 bg-white/[0.02] data-[state=open]:bg-white/[0.04] data-[state=open]:border-white/25 transition-all duration-300"
              >
                <AccordionTrigger className="px-5 py-4 text-left text-sm text-white hover:no-underline font-medium [&>svg]:text-white/40">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-0 text-sm text-white/60 leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Final CTA
// ─────────────────────────────────────────────────────────────────────────────

function FinalCTA() {
  const navigate = useNavigate()
  const { trackCTAClick } = useAnalytics()

  return (
    <section className="relative px-6 py-24 md:py-32 overflow-hidden border-t border-white/[0.07]">
      <div data-noir-drift="-260" className="absolute inset-x-0 top-0 bottom-0 flex items-center">
        <BigTextBackdrop
          text="Vamos?"
          size={32}
          anchor="middle"
          opacity={0.16}
        />
      </div>

      <div className="relative z-10 container mx-auto max-w-3xl text-center">
        <motion.p
          className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 mb-5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Você até aqui não foi à toa
        </motion.p>

        <h2 className="font-serif italic text-4xl md:text-5xl tracking-tight leading-[1.1] mb-6 text-white">
          <SplitText
            text="Sua próxima cliente já está procurando uma maquiadora como você."
            stagger={0.04}
          />
        </h2>

        <motion.p
          className="text-white/55 text-base md:text-lg max-w-xl mx-auto mb-10 font-light leading-relaxed"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          A diferença é se você vai aparecer organizada — ou perdida no meio de
          mensagens de WhatsApp.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.85, ease: EASE_NOIR }}
        >
          <MagneticButton strength={10}>
            <Button
              variant="primary"
              size="lg"
              className="rounded-none group min-w-[220px]"
              onClick={() => {
                trackCTAClick(
                  'final_cta_signup',
                  'plans_final_cta',
                  '/cadastro',
                )
                navigate('/cadastro')
              }}
            >
              Começar 14 dias grátis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </MagneticButton>
          <Button
            variant="outline"
            size="lg"
            className="rounded-none border-white/25 text-white hover:bg-white hover:text-black min-w-[220px]"
            onClick={() => {
              trackCTAClick(
                'final_cta_contact',
                'plans_final_cta',
                '/contato',
              )
              navigate('/contato')
            }}
          >
            Falar com a gente
          </Button>
        </motion.div>

        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-mono uppercase tracking-widest text-white/35"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 1.1 }}
        >
          <span className="flex items-center gap-2">
            <Shield className="w-3 h-3" /> Sem cartão
          </span>
          <span className="flex items-center gap-2">
            <Star className="w-3 h-3" /> Cancele em 2 cliques
          </span>
          <span className="flex items-center gap-2">
            <Lock className="w-3 h-3" /> Stripe seguro
          </span>
        </motion.div>
      </div>
    </section>
  )
}
