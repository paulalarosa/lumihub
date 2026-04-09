import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'

export const CTASection = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <section className="py-40 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-foreground/[0.02] backdrop-blur-3xl -z-10" />
      <div className="container mx-auto px-6 text-center max-w-4xl">
        <h2 className="text-5xl md:text-8xl font-bold text-foreground mb-8 tracking-tighter font-serif">
          {t('landing.cta.title')}{' '}
          <span className="italic font-normal text-foreground/70">{t('landing.cta.title_highlight')}</span>
        </h2>
        <p className="text-muted-foreground text-lg mb-12 font-mono uppercase tracking-[0.2em] max-w-2xl mx-auto">
          {t('landing.cta.subtitle')}
        </p>
        <Button
          variant="primary"
          size="lg"
          className="px-16"
          onClick={() => navigate('/cadastro')}
        >
          {t('landing.cta.button')}
        </Button>
      </div>
    </section>
  )
}
