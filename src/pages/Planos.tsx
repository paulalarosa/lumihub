import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import SEOHead from '@/components/seo/SEOHead'
import { useLanguage } from '@/hooks/useLanguage'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const Planos = () => {
  const { t } = useLanguage()
  const [billedYearly, setBilledYearly] = useState(false)

  const plans = [
    {
      name: t('plan_essential_name'),
      price: billedYearly ? '399,00' : '39,90',
      period: billedYearly ? 'ANO' : 'MÊS',
      description: t('plan_essential_desc'),
      badge: null,
      features: [
        { name: t('feat_10_clients'), included: true },
        { name: t('feat_tech_pack_basic'), included: true },
        { name: t('feat_smart_agenda'), included: true },
        { name: t('feat_contracts'), included: true },
        { name: t('feat_client_portal'), included: true },
        { name: t('feat_financial_dash'), included: false },
        { name: t('feat_commission'), included: false },
        { name: t('feat_ai_support'), included: false },
      ],
      ctaKey: 'cta_bottom_start',
      highlight: false,
    },
    {
      name: t('plan_professional_name'),
      price: billedYearly ? '899,00' : '89,90',
      period: billedYearly ? 'ANO' : 'MÊS',
      description: t('plan_professional_desc'),
      badge: t('plan_professional_badge'),
      features: [
        { name: t('feat_unlimited_clients'), included: true },
        { name: t('feat_tech_pack_gold'), included: true },
        { name: t('feat_full_analytics'), included: true },
        { name: t('feat_custom_portal'), included: true },
        { name: t('feat_moodboard'), included: true },
        { name: t('feat_anamnesis'), included: true },
        { name: t('feat_commission'), included: false },
        { name: t('feat_ai_support'), included: false },
      ],
      ctaKey: 'cta_bottom_plans',
      highlight: true,
    },
    {
      name: t('plan_studio_name'),
      price: billedYearly ? '1499,00' : '149,90',
      period: billedYearly ? 'ANO' : 'MÊS',
      description: t('plan_studio_desc'),
      badge: t('plan_studio_badge'),
      features: [
        { name: t('feat_all_pro'), included: true },
        { name: t('feat_team_mgmt'), included: true },
        { name: t('feat_auto_comm'), included: true },
        { name: t('feat_ops_ai'), included: true },
        { name: t('feat_perf_artist'), included: true },
        { name: t('feat_multi_user'), included: true },
        { name: t('feat_priority_support'), included: true },
        { name: t('feat_api'), included: true },
      ],
      ctaKey: 'cta_bottom_plans',
      highlight: false,
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  }

  return (
    <>
      <SEOHead
        title="Planos e Preços - Premium"
        description="Escolha o plano ideal para seu negócio de beleza."
        keywords="preços kontrol, planos khaos kontrol"
        url="https://khaoskontrol.com.br/planos"
        type="service"
        breadcrumbs={[
          { name: 'Home', url: 'https://khaoskontrol.com.br' },
          { name: 'Planos', url: 'https://khaoskontrol.com.br/planos' },
        ]}
        priceRange="R$39-R$149"
      />

      {/* Main Background with Radial Glow and grid */}
      <div className="min-h-screen bg-[#000000] text-white selection:bg-purple-500/30 selection:text-white font-sans relative flex flex-col items-center overflow-x-hidden">
        {/* 1. Global Structure / Radial Glow Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Ultra-subtle purple/gray radial glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] max-w-[1200px] h-[60vh] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-[#000000]/0 to-transparent blur-[100px] opacity-70" />
          {/* Dotted grid effect very subtle */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        {/* Top Nav Pill (Return/Home) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative z-20 mt-8 flex items-center bg-[#050505] border border-white/5 rounded-full p-1.5 shadow-2xl backdrop-blur-md"
        >
          <Link
            to="/"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors mr-4"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </Link>
          <nav className="flex items-center gap-6 px-4 text-sm font-medium text-zinc-400">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-white">Pricing</span>
          </nav>
        </motion.div>

        {/* Main Content Area */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 w-full max-w-6xl px-4 md:px-6 flex flex-col items-center pt-16 pb-32"
        >
          {/* Title */}
          <motion.div variants={itemVariants} className="text-center mb-10">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">
              Invest in your Growth
            </h2>
            <p className="text-zinc-400 text-sm md:text-base max-w-lg mx-auto">
              Transparent pricing for beauty professionals. Scale your
              operations without worrying about infrastructure.
            </p>
          </motion.div>

          {/* 1. Toggle (Mensal / Anual) */}
          <motion.div
            variants={itemVariants}
            className="relative flex items-center p-1 bg-[#050505] border border-white/10 rounded-full backdrop-blur-md mb-20 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
          >
            {['Mensal', 'Anual'].map((option) => {
              const isAnual = option === 'Anual'
              const isActive = isAnual ? billedYearly : !billedYearly
              return (
                <button
                  key={option}
                  onClick={() => setBilledYearly(isAnual)}
                  className={cn(
                    'relative px-8 py-3 text-sm font-semibold rounded-full uppercase tracking-wider transition-colors z-10',
                    isActive
                      ? 'text-white'
                      : 'text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="pricing-toggle-pill"
                      className="absolute inset-0 bg-white/10 rounded-full -z-10 border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25,
                      }}
                    />
                  )}
                  {option}
                </button>
              )
            })}

            {/* Neon Green Tag */}
            <div className="absolute -top-3 -right-2 md:-right-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Economize 20%
            </div>
          </motion.div>

          {/* 2. Pricing Cards Grid */}
          <div className="grid md:grid-cols-3 gap-6 w-full items-center">
            {plans.map((plan, index) => {
              const isPro = plan.highlight

              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover="hover"
                  className={cn(
                    'group relative rounded-3xl p-8 flex flex-col transition-all duration-500 w-full overflow-hidden',
                    isPro
                      ? 'bg-[#050505] border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.1)] backdrop-blur-2xl z-10 md:py-12 md:scale-105'
                      : 'bg-[#050505] border border-white/5 backdrop-blur-xl h-full',
                  )}
                >
                  {/* Subtly Glowing Border / Spotlight Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div
                      className={cn(
                        'absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] to-transparent',
                        isPro ? 'from-purple-500/20' : 'from-white/10',
                      )}
                    />
                    {/* Hover border highlight */}
                    <div
                      className={cn(
                        'absolute inset-0 border rounded-3xl',
                        isPro ? 'border-purple-500/50' : 'border-white/20',
                      )}
                    />
                  </div>

                  {/* 3. Typography & Content */}
                  <div className="relative z-10 mb-8">
                    {plan.badge && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                        {plan.badge}
                      </div>
                    )}
                    <p className="text-zinc-400 text-sm font-semibold uppercase tracking-widest mb-4">
                      {plan.name}
                    </p>
                    <div className="flex items-start gap-1">
                      <span className="text-lg font-bold text-zinc-500 mt-1 align-top">
                        R$
                      </span>
                      <span className="text-5xl font-bold tracking-tighter text-white">
                        {plan.price}
                      </span>
                      <span className="text-sm text-zinc-500 font-medium self-end mb-1">
                        /{plan.period}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 mt-4 h-10 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Ultra-thin divider */}
                  <div className="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

                  {/* Features List */}
                  <div className="relative z-10 flex-1 space-y-4 mb-10">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {feature.included ? (
                            <Check
                              className={cn(
                                'w-4 h-4',
                                isPro ? 'text-purple-400' : 'text-white/80',
                              )}
                            />
                          ) : (
                            <X className="w-4 h-4 text-zinc-700" />
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-sm',
                            feature.included
                              ? 'text-gray-400'
                              : 'text-zinc-700 line-through opacity-50',
                          )}
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 4. Call to Action Button */}
                  <Link to="/cadastro" className="relative z-10 w-full mt-auto">
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button
                        className={cn(
                          'w-full h-12 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden group/btn',
                          isPro
                            ? 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                            : 'bg-transparent border border-white/10 text-white hover:bg-white/5 hover:border-white/20',
                        )}
                      >
                        {isPro && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] skew-x-12 group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                        )}
                        {isPro ? 'Comece com o PRO' : 'Assine o Básico'}
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default Planos
