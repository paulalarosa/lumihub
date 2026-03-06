import { motion } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import SpotlightCard from '@/components/reactbits/SpotlightCard'
import { FloatingShapes3D } from '@/components/animations/FloatingShapes3D'
import {
  Crown,
  Clock,
  Bot,
  FileSignature,
  CreditCard,
  TrendingUp,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function FeaturesSection() {
  const { t } = useLanguage()

  const features = [
    {
      icon: Crown,
      title: t('feature_1_title'),
      description: t('feature_1_desc'),
    },
    {
      icon: Clock,
      title: t('feature_2_title'),
      description: t('feature_2_desc'),
    },
    {
      icon: Bot,
      title: t('feature_3_title'),
      description: t('feature_3_desc'),
    },
    {
      icon: FileSignature,
      title: t('feature_4_title'),
      description: t('feature_4_desc'),
    },
    {
      icon: CreditCard,
      title: t('feature_5_title'),
      description: t('feature_5_desc'),
    },
    {
      icon: TrendingUp,
      title: t('feature_6_title'),
      description: t('feature_6_desc'),
    },
  ]

  const prefersReducedMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const shouldReducePerformance = isMobile || prefersReducedMotion

  return (
    <section className="py-32 bg-transparent relative top-[-10px] z-20 overflow-hidden">
      {/* 3D Floating Shapes background */}
      {!shouldReducePerformance && <FloatingShapes3D />}

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-20">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-[10px] shadow-[0_4px_20px_0_rgba(255,255,255,0.05)] uppercase tracking-[0.3em] text-white/60 mb-8 w-fit"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
              {t('features_subtitle')}
            </motion.div>
            <h2 className="font-serif text-5xl md:text-7xl text-white tracking-tight">
              {t('features_title')}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <SpotlightCard
              key={index}
              className="rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(255,255,255,0.02)] transition-colors duration-500 overflow-hidden"
              spotlightColor="rgba(255, 255, 255, 0.1)"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.6 }}
                whileHover={{ y: -5, scale: 1.02 }}
                viewport={{ once: true }}
                className="h-full flex flex-col justify-between p-8 md:p-10 min-h-[300px]"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/40 font-mono tracking-widest">
                    0{index + 1}
                  </span>
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transform transition-transform group-hover:scale-110 group-hover:bg-white/10">
                    <feature.icon className="h-5 w-5 text-white/70 stroke-[1.5]" />
                  </div>
                </div>

                <div className="space-y-4 pt-12">
                  <h3 className="text-sm uppercase tracking-[0.15em] text-white font-bold">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/40 leading-relaxed font-light">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  )
}
