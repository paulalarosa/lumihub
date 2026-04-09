import { Counter } from './Counter'
import { useLanguage } from '@/hooks/useLanguage'

export const KeyNumbersSection = () => {
  const { t } = useLanguage()

  const stats = [
    { label: t('landing.stats.clients'), value: '+5K' },
    { label: t('landing.stats.contracts'), value: '12K' },
    { label: t('landing.stats.uptime'), value: '99.9%' },
    { label: t('landing.stats.projects'), value: '8.4K' },
  ]

  return (
    <section className="py-24 bg-background border-y border-border/30 relative z-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left">
          {stats.map((stat, i) => (
            <div key={i} className="group">
              <p className="text-8xl font-bold text-foreground group-hover:text-foreground transition-colors mb-2">
                <Counter value={stat.value} />
              </p>
              <p className="text-[10px] font-mono text-muted-foreground tracking-[0.3em]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
