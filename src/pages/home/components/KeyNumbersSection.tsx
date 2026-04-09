import { useLanguage } from '@/hooks/useLanguage'
import { Counter } from './Counter'

export const KeyNumbersSection = () => {
  const { t } = useLanguage()

  return (
    <section className="py-24 bg-black border-y border-white/5 relative z-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left">
          {[
            { label: t('home.stats.clients'), value: '+5K' },
            { label: t('home.stats.contracts'), value: '12K' },
            { label: t('home.stats.uptime'), value: '99.9%' },
            { label: t('home.stats.projects'), value: '8.4K' },
          ].map((stat, i) => (
            <div key={i} className="group">
              <p className="text-8xl font-bold text-white group-hover:text-white transition-colors mb-2">
                <Counter value={stat.value} />
              </p>
              <p className="text-[10px] font-mono text-white/40 tracking-[0.3em]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
