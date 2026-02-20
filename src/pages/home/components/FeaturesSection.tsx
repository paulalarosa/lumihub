import { motion } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import SpotlightCard from '@/components/reactbits/SpotlightCard'
import DecryptedText from '@/components/reactbits/DecryptedText'
import {
  Crown,
  Clock,
  Bot,
  FileSignature,
  CreditCard,
  TrendingUp,
} from 'lucide-react'

export function FeaturesSection() {
  const { t } = useLanguage()

  const features = [
    {
      icon: Crown,
      title: t('feature_1_title'),
      description: t('feature_1_desc'),
      size: 'large',
    },
    {
      icon: Clock,
      title: t('feature_2_title'),
      description: t('feature_2_desc'),
      size: 'normal',
    },
    {
      icon: Bot,
      title: t('feature_3_title'),
      description: t('feature_3_desc'),
      size: 'normal',
    },
    {
      icon: FileSignature,
      title: t('feature_4_title'),
      description: t('feature_4_desc'),
      size: 'normal',
    },
    {
      icon: CreditCard,
      title: t('feature_5_title'),
      description: t('feature_5_desc'),
      size: 'normal',
    },
    {
      icon: TrendingUp,
      title: t('feature_6_title'),
      description: t('feature_6_desc'),
      size: 'large',
    },
  ]

  return (
    <section className="py-32 bg-black relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-24 space-y-4">
          <h2 className="font-serif font-light text-6xl text-white tracking-tighter">
            {t('features_title')}
          </h2>
          <p className="font-mono text-sm text-gray-500 uppercase tracking-widest">
            {t('features_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <SpotlightCard
              key={index}
              className="bg-black hover:bg-neutral-900/50 transition-colors duration-300 border-white/10"
              spotlightColor="rgba(255, 255, 255, 0.15)"
            >
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="h-full flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <DecryptedText
                    text={`[MOD.0${index + 1}]`}
                    animateOn="view"
                    speed={50}
                    className="font-mono text-[10px] text-gray-600"
                  />
                  <feature.icon className="h-8 w-8 text-white stroke-[1.5]" />
                </div>

                <div className="space-y-4 pt-8">
                  <h3 className="font-mono text-lg uppercase tracking-wider text-white">
                    {feature.title}
                  </h3>
                  <p className="font-mono text-xs text-gray-500 leading-relaxed">
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
