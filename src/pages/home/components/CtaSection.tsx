import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { TrackedButton } from '@/components/analytics/TrackedButton'
import { useLanguage } from '@/hooks/useLanguage'

export function CtaSection() {
  const { t } = useLanguage()

  return (
    <section className="py-32 relative overflow-hidden bg-transparent z-10 bottom-[10px]">
      <div className="container mx-auto px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto space-y-12 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 md:p-20 shadow-[0_8px_32px_0_rgba(255,255,255,0.02)]"
        >
          {/* Ambient center glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="space-y-6 relative z-10">
            <h2 className="font-serif text-5xl md:text-7xl text-white tracking-tight leading-[0.9]">
              {t('cta_bottom_title')}
            </h2>
            <p className="text-sm font-light text-white/50 max-w-lg mx-auto leading-relaxed">
              {t('cta_bottom_subtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
            <Link to="/register">
              <TrackedButton
                trackingName="cta_start_trial"
                trackingLocation="home_cta"
                trackingDestination="/register"
                size="lg"
                className="w-full sm:w-auto text-[10px] font-bold uppercase tracking-widest px-10 py-5 h-auto flex items-center justify-center gap-2 group"
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    ;(window as any).gtag('event', 'generate_lead', {
                      event_category: 'conversion',
                      event_label: 'bottom_cta_trial',
                    })
                  }
                }}
              >
                {t('cta_bottom_start')}
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </TrackedButton>
            </Link>
            <Link to="/planos">
              <TrackedButton
                trackingName="cta_view_plans"
                trackingLocation="home_cta"
                trackingDestination="/planos"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-10 py-5 h-auto text-[10px] font-bold uppercase tracking-widest"
              >
                {t('cta_bottom_plans')}
              </TrackedButton>
            </Link>
          </div>

          <div className="text-[10px] text-white/30 font-mono font-bold uppercase tracking-widest relative z-10 pt-4">
            {t('cta_secure')}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
