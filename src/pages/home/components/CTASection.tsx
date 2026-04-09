import { useLanguage } from '@/hooks/useLanguage'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

export const CTASection = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { trackCTAClick } = useAnalytics()

  return (
    <section className="py-32 bg-black relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-3xl">
        {}
        <p className="text-white/30 text-xs font-mono uppercase tracking-[0.2em] mb-6 text-center">
          {t('home.cta_section.eyebrow')}
        </p>

        <h2 className="text-4xl md:text-6xl font-serif text-white text-center leading-tight mb-6 tracking-tight">
          {t('home.cta_section.title')}
        </h2>

        {}
        <p className="text-white/40 text-center text-base md:text-lg mb-12 max-w-xl mx-auto leading-relaxed">
          {t('home.cta_section.subtitle')}
        </p>

        {}
        <div className="flex flex-col items-center gap-4">
          <Button
            variant="primary"
            size="lg"
            className="px-12 group"
            onClick={() => {
              trackCTAClick('cta_bottom_signup', 'cta_section', '/cadastro')
              navigate('/cadastro')
            }}
          >
            {t('home.cta_section.cta')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-xs text-white/25">
            {t('home.cta_section.disclaimer')}
          </p>
        </div>
      </div>
    </section>
  )
}
