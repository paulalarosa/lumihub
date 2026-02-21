import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

  return (
    <section className="py-32 bg-black relative border-t border-white/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-stretch">
          <div className="flex flex-col justify-center space-y-12">
            <div className="space-y-6">
              <h2 className="font-serif text-5xl text-white leading-none whitespace-pre-line">
                {t('benefits_title').replace(' ', '\n')}
              </h2>
              <div className="h-[1px] w-24 bg-white/50" />
            </div>

            <div className="space-y-6 font-mono text-sm">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-4 text-gray-400 hover:text-white transition-colors cursor-default"
                >
                  <span className="text-white shrink-0">[&gt;]</span>
                  <span className="uppercase tracking-wide">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <Link to="/recursos">
              <Button
                variant="ghost"
                className="group rounded-none border border-white/20 px-8 py-6 text-white hover:bg-white hover:text-black transition-all"
              >
                <span className="font-mono text-xs uppercase tracking-[0.2em] mr-4">
                  {t('view_all_features')}
                </span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-col justify-center">
            <div className="border-l-2 border-white pl-12 py-12 space-y-24">
              {[
                { value: 10, suffix: '+', label: t('stat_hours_label') },
                { value: 40, suffix: '%', label: t('stat_revenue_label') },
                {
                  value: 98,
                  suffix: '%',
                  label: t('stat_satisfaction_label'),
                },
              ].map((stat, i) => (
                <div key={i} className="relative">
                  <div className="font-mono text-7xl md:text-8xl font-bold text-white tracking-tighter leading-none">
                    <ScrambleNumber value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="font-mono text-[10px] text-gray-500 uppercase tracking-[0.3em] mt-2 ml-1">
                    /// {stat.label}
                  </div>
                </div>
              ))}

              <div className="relative">
                <div className="font-mono text-7xl md:text-8xl font-bold text-white tracking-tighter leading-none">
                  24/7
                </div>
                <div className="font-mono text-[10px] text-gray-500 uppercase tracking-[0.3em] mt-2 ml-1">
                  /// {t('stat_support_label')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
