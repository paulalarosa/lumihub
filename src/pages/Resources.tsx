import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  Users,
  FileText,
  BarChart3,
  Palette,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import SEOHead from '@/components/seo/SEOHead'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { useLanguage } from '@/hooks/useLanguage'

const services = (t: ReturnType<typeof useLanguage>['t']) => [
  {
    icon: Calendar,
    title: t('resources.services.calendar.title'),
    description: t('resources.services.calendar.desc'),
  },
  {
    icon: Users,
    title: t('resources.services.clients.title'),
    description: t('resources.services.clients.desc'),
  },
  {
    icon: FileText,
    title: t('resources.services.contracts.title'),
    description: t('resources.services.contracts.desc'),
  },
  {
    icon: BarChart3,
    title: t('resources.services.finance.title'),
    description: t('resources.services.finance.desc'),
  },
  {
    icon: Palette,
    title: t('resources.services.moodboard.title'),
    description: t('resources.services.moodboard.desc'),
  },
  {
    icon: Shield,
    title: t('resources.services.portal.title'),
    description: t('resources.services.portal.desc'),
  },
]

const statsData = (t: ReturnType<typeof useLanguage>['t']) => [
  { value: 100, suffix: '+', label: t('resources.stats.projects') },
  { value: 32, suffix: '', label: t('resources.stats.partners') },
  { value: 3, suffix: '', label: t('resources.stats.offices') },
]

export default function Resources() {
  const { t } = useLanguage()
  const resourceServices = services(t)
  const resourceStats = statsData(t)

  return (
    <>
      <SEOHead
        title={t('resources.seo_title')}
        description={t('resources.seo_description')}
        keywords="recursos sistema maquiadora, funcionalidades CRM beauty, agenda maquiadora, contrato digital"
        url="https://khaoskontrol.com.br/recursos"
        breadcrumbs={[
          { name: t('SIDEBAR_MENU_MAIN'), url: 'https://khaoskontrol.com.br/' },
          { name: t('header_features'), url: 'https://khaoskontrol.com.br/recursos' },
        ]}
      />
      <div className="min-h-screen bg-black text-white relative overflow-hidden">

        <div className="fixed top-[-15%] left-[-10%] w-[45%] h-[45%] bg-white/[0.015] blur-[180px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-white/[0.02] blur-[180px] rounded-full pointer-events-none" />

        <section className="relative pt-28 sm:pt-36 md:pt-44 pb-20 border-b border-white/5">
          <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay">
            <img
              src="/khaos-uploads/734febb0-c2fc-4623-98e2-bbe5a386408f.png"
              alt=""
              className="w-full h-full object-cover grayscale brightness-50"
            />
          </div>

          <div className="container mx-auto px-6 lg:px-10 relative z-10">
            <div className="max-w-4xl space-y-6">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-xs text-white/40 tracking-widest uppercase font-mono"
              >
                {t('resources.header.eyebrow')}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-tight"
              >
                {t('resources.header.title')}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-white/50 text-base md:text-lg max-w-xl leading-relaxed"
              >
                {t('resources.header.subtitle')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 pt-2"
              >
                <Link to="/planos" className="w-full sm:w-auto">
                  <Button className="h-11 px-7 rounded-full text-sm font-medium group w-full sm:w-auto">
                    {t('resources.cta.choose_plan')}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/contato" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="h-11 px-7 rounded-full border-white/10 text-white hover:bg-white/5 text-sm font-medium w-full sm:w-auto"
                  >
                    {t('resources.cta.contact')}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 border-b border-white/5">
          <div className="container mx-auto px-6 lg:px-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-10 sm:gap-16 md:gap-24"
            >
              {resourceStats.map((stat, i) => (
                <div key={i}>
                  <p className="font-serif text-6xl md:text-8xl text-white">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40 mt-3 font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-6 lg:px-10">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-14 gap-6">
              <div className="space-y-3 max-w-xl">
                <span className="text-xs text-white/40 tracking-widest uppercase font-mono">
                  {t('resources.about.eyebrow')}
                </span>
                <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05]">
                  {t('resources.about.title')}
                </h2>
                <p className="text-sm text-white/50 leading-relaxed">
                  {t('resources.about.desc')}
                </p>
              </div>
              <Link to="/contato" className="flex-shrink-0">
                <Button
                  variant="outline"
                  className="h-11 px-7 rounded-full border-white/10 text-white hover:bg-white hover:text-black text-sm font-medium group transition-all"
                >
                  {t('resources.cta.contact')}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {resourceServices.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.6 }}
                  whileHover={{ y: -4 }}
                  className="p-6 md:p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 group"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 flex items-center text-white/40 group-hover:text-white transition-colors duration-500">
                      <service.icon className="w-8 h-8" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-medium text-white">
                      {service.title}
                    </h3>
                    <p className="text-sm text-white/50 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-28 md:py-32 border-t border-white/5">
          <div className="container mx-auto px-6 lg:px-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <span className="text-xs text-white/40 tracking-widest uppercase font-mono">
                Comece Agora
              </span>
              <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white tracking-tight leading-[1.05]">
                Pronta para
                <br />
                <span className="italic font-serif">transformar seu estúdio?</span>
              </h2>
              <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
                {t('resources.header.subtitle')}
              </p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <Link to="/planos">
                  <Button className="h-12 px-8 rounded-full text-sm font-medium group">
                    {t('resources.cta.choose_plan')}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  )
}
