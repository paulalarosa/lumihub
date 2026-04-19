import { useLanguage } from '@/hooks/useLanguage'
import { Counter } from './Counter'

export const KeyNumbersSection = () => {
  const { t } = useLanguage()

  const stats = [
    { label: t('home.stats.clients'), value: '5K', prefix: '+' },
    { label: t('home.stats.contracts'), value: '12K', prefix: '' },
    { label: t('home.stats.uptime'), value: '99.9', prefix: '', suffix: '%' },
    { label: t('home.stats.projects'), value: '8.4K', prefix: '' },
  ]

  return (
    <section className="bg-black relative z-20 border-t border-white/[0.06]">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.06]">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="group flex flex-col gap-6 px-8 py-12 lg:px-12 lg:py-16 hover:bg-white/[0.015] transition-colors duration-500"
            >
              <span className="font-mono text-[9px] text-white/20 tracking-[0.4em] uppercase">
                0{i + 1}
              </span>

              <p className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-none">
                {stat.prefix}
                <Counter value={stat.value} />
                {stat.suffix}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <p className="font-mono text-[10px] text-white/35 tracking-[0.2em] uppercase leading-loose max-w-[12ch]">
                  {stat.label}
                </p>
                <div className="h-px w-6 bg-white/15 group-hover:w-10 group-hover:bg-white/40 transition-all duration-700" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-px w-full bg-white/[0.06]" />
      </div>
    </section>
  )
}
