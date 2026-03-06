import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { ScrambleNumber } from '@/components/ui/animation/ScrambleNumber'
import { useLanguage } from '@/hooks/useLanguage'

export function BenefitsSection() {
  const { t } = useLanguage()

  const benefits = [
    t('benefit_1'),
    t('benefit_2'),
    t('benefit_3'),
    t('benefit_4'),
  ]

  const stats = [
    { value: 10, suffix: '+', label: t('stat_hours_label') },
    { value: 40, suffix: '%', label: t('stat_revenue_label') },
    { value: 98, suffix: '%', label: t('stat_satisfaction_label') },
  ]

  return (
    <section className="py-32 bg-transparent relative">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          {/* Left: text content */}
          <div className="flex flex-col gap-12 bg-white/5 backdrop-blur-3xl border border-white/10 p-10 md:p-14 rounded-[3rem] shadow-[0_8px_32px_0_rgba(255,255,255,0.02)]">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-[10px] shadow-[0_4px_20px_0_rgba(255,255,255,0.05)] uppercase tracking-[0.3em] text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                {t('benefits_title')}
              </span>
              <h2 className="font-serif text-5xl md:text-6xl text-white leading-[0.9] tracking-tight">
                {t('benefits_title')}
              </h2>
            </div>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4 text-white/50 hover:text-white transition-colors group p-4 rounded-2xl hover:bg-white/5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 shrink-0 group-hover:bg-white group-hover:shadow-[0_0_10px_white] transition-all" />
                  <span className="text-xs uppercase tracking-widest leading-relaxed">
                    {benefit}
                  </span>
                </motion.div>
              ))}
            </div>

            <Link
              to="/recursos"
              className="inline-flex items-center gap-3 text-white bg-white/10 hover:bg-white/20 px-6 py-4 rounded-full transition-all group w-fit shadow-[0_4px_20px_rgba(255,255,255,0.05)] border border-white/10"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                {t('view_all_features')}
              </span>
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {/* Right: stats */}
          <div className="flex flex-col gap-8 lg:pl-12">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ scale: 1.02, y: -5 }}
                viewport={{ once: true }}
                className="relative bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(255,255,255,0.02)] overflow-hidden"
              >
                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[50px] rounded-full pointer-events-none" />

                <div className="font-serif text-7xl md:text-8xl text-white tracking-tighter leading-none mb-2">
                  <ScrambleNumber value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">
                  {stat.label}
                </div>
              </motion.div>
            ))}

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(255,255,255,0.02)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
              <div className="font-serif text-7xl md:text-8xl text-white tracking-tighter leading-none mb-2">
                24/7
              </div>
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">
                {t('stat_support_label')}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
