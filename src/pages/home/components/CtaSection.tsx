import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { TrackedButton } from '@/components/analytics/TrackedButton'
import { useLanguage } from '@/hooks/useLanguage'

export function CtaSection() {
  const { t } = useLanguage()

  return (
    <section className="py-32 relative overflow-hidden bg-black border-t border-white/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto space-y-10"
        >
          <div className="space-y-6">
            <h2 className="font-serif text-5xl lg:text-7xl text-white tracking-tighter uppercase">
              {t('cta_bottom_title')}
            </h2>
            <p className="text-lg text-white/60 font-mono uppercase tracking-widest">
              {t('cta_bottom_subtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <TrackedButton
                trackingName="cta_start_trial"
                trackingLocation="home_cta"
                trackingDestination="/register"
                size="lg"
                className="w-full sm:w-auto bg-white text-black hover:bg-white/80 text-lg px-8 py-6 rounded-none transition-all duration-300 font-mono uppercase tracking-widest"
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    ;(window as any).gtag('event', 'generate_lead', {
                      event_category: 'conversion',
                      event_label: 'bottom_cta_trial',
                    })
                  }
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {t('cta_bottom_start')}
              </TrackedButton>
            </Link>
            <Link to="/register">
              <TrackedButton
                trackingName="cta_view_plans"
                trackingLocation="home_cta"
                trackingDestination="/register"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-transparent border border-white/20 text-white hover:bg-white hover:text-black text-lg px-8 py-6 rounded-none font-mono uppercase tracking-widest"
              >
                {t('cta_bottom_plans')}
              </TrackedButton>
            </Link>
          </div>

          <div className="text-xs text-white/30 font-mono uppercase tracking-widest">
            {t('cta_secure')}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
