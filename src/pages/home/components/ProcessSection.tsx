import { useLanguage } from '@/hooks/useLanguage'
import { motion } from 'framer-motion'
import { BarChart3, ShieldCheck, Rocket, Clock } from 'lucide-react'

export const ProcessSection = () => {
  const { t } = useLanguage()

  return (
    <section className="py-40 bg-black relative">
      <div className="container mx-auto px-6 md:px-16 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-20 items-end mb-32">
          <div>
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-10 tracking-tight leading-tight font-serif capitalize">
              {t('home.process.title')}
            </h2>
            <p className="text-white/50 text-lg md:text-xl max-w-md leading-relaxed font-mono uppercase tracking-wider">
              {t('home.process.subtitle')}
            </p>
          </div>
          <div className="flex justify-end">
            <div className="p-8 glass-strong rounded-3xl max-w-sm">
              <Clock className="w-12 h-12 text-white mb-6" />
              <h3 className="text-xl font-bold text-white mb-4 font-serif">
                {t('home.process.save_time.title')}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                {t('home.process.save_time.desc')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: BarChart3,
              title: t('home.process.features.analytics.title'),
              desc: t('home.process.features.analytics.desc'),
            },
            {
              icon: ShieldCheck,
              title: t('home.process.features.legal.title'),
              desc: t('home.process.features.legal.desc'),
            },
            {
              icon: Rocket,
              title: t('home.process.features.sales.title'),
              desc: t('home.process.features.sales.desc'),
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="p-10 card group hover:scale-[1.02] transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <feature.icon className="w-10 h-10 text-white mb-8 opacity-40 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-2xl font-bold text-white mb-4 font-serif">
                {feature.title}
              </h3>
              <p className="text-white/40 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
