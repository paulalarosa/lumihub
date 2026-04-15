import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  Users,
  FileText,
  BarChart3,
  Palette,
  Shield,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import SEOHead from '@/components/seo/SEOHead'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useLanguage } from '@/hooks/useLanguage'

const services = (t: any) => [
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

const statsData = (t: any) => [
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
        {}
        <div className="fixed top-[-15%] left-[-10%] w-[45%] h-[45%] bg-white/[0.015] blur-[180px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-white/[0.02] blur-[180px] rounded-full pointer-events-none" />

        {}
        <section className="relative pt-40 pb-24 border-b border-white/5">
          {}
          <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
            <img
              src="/khaos-uploads/734febb0-c2fc-4623-98e2-bbe5a386408f.png"
              alt="Background Texture"
              className="w-full h-full object-cover grayscale brightness-50"
            />
          </div>

          <div className="container mx-auto px-6 lg:px-10 relative z-10 text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              <SectionHeader
                eyebrow={t('resources.header.eyebrow')}
                title={t('resources.header.title')}
                subtitle={t('resources.header.subtitle')}
                centered={false}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center gap-4 justify-center"
              >
                <Link to="/planos">
                  <Button className="h-11 px-7 rounded-full text-sm font-medium group">
                    {t('resources.cta.choose_plan')}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/contato">
                  <Button
                    variant="outline"
                    className="h-11 px-7 rounded-full border-white/10 text-white hover:bg-white/5 text-sm font-medium"
                  >
                    {t('resources.cta.contact')}
                  </Button>
                </Link>
              </motion.div>
            </div>

            {}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col md:flex-row gap-12 md:gap-16 mt-24 justify-center"
            >
              {resourceStats.map((stat, i) => (
                <div
                  key={i}
                  className="text-center md:text-left flex flex-col items-center md:items-start"
                >
                  <p className="font-serif text-6xl md:text-8xl text-white">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/60 mt-4 font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {}
        <section className="py-24 border-b border-white/5 relative bg-transparent">
          <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
            <img
              src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=2000&auto=format&fit=crop"
              alt="Background Texture"
              className="w-full h-full object-cover grayscale brightness-50"
            />
          </div>
          <div className="container mx-auto px-6 lg:px-10 text-center relative z-10">
            <div className="max-w-3xl mx-auto space-y-6">
              <span className="text-xs text-muted-foreground tracking-widest uppercase">
                {t('resources.about.eyebrow')}
              </span>
              <h2 className="font-serif text-4xl md:text-6xl text-white tracking-tight leading-[1.05]">
                {t('resources.about.title').split('plataforma')[0]}<span className="italic font-serif">plataforma</span>
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                {t('resources.about.desc')}
              </p>
            </div>
          </div>
        </section>

        {}
        <section className="py-24 border-t border-white/5">
          <div className="container mx-auto px-6 lg:px-10">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8 text-left">
              <div className="space-y-4">
                <span className="text-xs text-muted-foreground tracking-widest uppercase">
                  {t('header_features')}
                </span>
                <h2 className="font-serif text-4xl md:text-6xl text-white tracking-tight leading-[1.05]">
                  {t('header_features').split(' ')[0]} <span className="italic font-serif">{t('header_features').split(' ')[1] || 'Recursos'}</span>
                </h2>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  {t('blog.subtitle')}
                </p>
              </div>
              <Link to="/contato">
                <Button
                  variant="outline"
                  className="h-11 px-7 rounded-full border-white/10 text-white hover:bg-white hover:text-black text-sm font-medium group transition-all"
                >
                  {t('resources.cta.contact')}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {resourceServices.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.6 }}
                  whileHover={{ y: -4 }}
                  className="p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 group text-left"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 flex items-center text-white/40 group-hover:text-white transition-colors duration-500">
                      <service.icon className="w-8 h-8" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-medium text-white">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {}
        <section className="py-32 border-t border-white/5">
          <div className="container mx-auto px-6 lg:px-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <span className="text-xs text-muted-foreground tracking-widest uppercase">
                {t('blog.category', { category: 'Oferta Especial' }) || 'Oferta Especial'}
              </span>
              <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white tracking-tight leading-[1.05]">
                {t('plans.social_proof').split(' ')[0]}
                <br />
                <span className="italic font-serif">{t('plans.social_proof').split(' ').slice(1).join(' ')}</span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                {t('cta_bottom_subtitle')}
              </p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <Link to="/planos">
                  <Button className="h-12 px-8 rounded-full text-sm font-medium group">
                    {t('cta_bottom_start')}
                    <Sparkles className="w-4 h-4 ml-2" />
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
