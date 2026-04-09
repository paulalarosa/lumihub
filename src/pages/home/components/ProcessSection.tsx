import { motion } from 'framer-motion'
import { BarChart3, ShieldCheck, Rocket, Clock } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

export const ProcessSection = () => {
  const { t } = useLanguage()

  const features = [
    {
      icon: BarChart3,
      title: t('landing.process.feature1_title'),
      desc: t('landing.process.feature1_desc'),
    },
    {
      icon: ShieldCheck,
      title: t('landing.process.feature2_title'),
      desc: t('landing.process.feature2_desc'),
    },
    {
      icon: Rocket,
      title: t('landing.process.feature3_title'),
      desc: t('landing.process.feature3_desc'),
    },
  ]

  return (
    <section className="py-40 bg-background relative">
      <div className="container mx-auto px-6 md:px-16 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-20 items-end mb-32">
          <div>
            <h2 className="text-5xl md:text-7xl font-bold text-foreground mb-10 tracking-tight leading-tight font-serif capitalize">
              {t('landing.process.title')}{' '}
              <span className="italic font-normal text-foreground/70">{t('landing.process.title_highlight1')}</span>
              <br />
              {t('landing.process.title_line2')}{' '}
              <span className="italic font-normal text-foreground/70">{t('landing.process.title_highlight2')}</span>
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-md leading-relaxed font-mono uppercase tracking-wider">
              {t('landing.process.subtitle')}
            </p>
          </div>
          <div className="flex justify-end">
            <div className="p-8 glass-strong rounded-3xl max-w-sm">
              <Clock className="w-12 h-12 text-foreground mb-6" />
              <h3 className="text-xl font-bold text-foreground mb-4 font-serif">
                {t('landing.process.highlight_title')}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('landing.process.highlight_desc')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              className="p-10 card group hover:scale-[1.02] transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <feature.icon className="w-10 h-10 text-foreground mb-8 opacity-40 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-2xl font-bold text-foreground mb-4 font-serif">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
