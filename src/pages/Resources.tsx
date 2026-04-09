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

export default function Resources() {
  const { t } = useLanguage()

  const services = [
    {
      icon: Calendar,
      title: t('sidebar.schedule'),
      description: t('landing.resources.stats.projects'), // Example fallback or direct key
    },
    {
      icon: Users,
      title: t('sidebar.clients'),
      description: t('feature_1_desc'),
    },
    {
      icon: FileText,
      title: t('sidebar.contracts'),
      description: t('feature_4_desc'),
    },
    {
      icon: BarChart3,
      title: t('sidebar.financial'),
      description: t('feature_5_desc'),
    },
    {
      icon: Palette,
      title: 'Moodboard & Briefing', // Assuming these might need keys too
      description: t('feature_6_desc'),
    },
    {
      icon: Shield,
      title: t('sidebar.subscription'),
      description: t('feature_3_desc'),
    },
  ]


  // Better approach: use keys from pt.json for desc too if I had them.
  // For now I'll use the ones I just added or hardcoded for a moment if missing.

  const stats = [
    { value: 100, suffix: '+', label: t('landing.resources.stats.projects') },
    { value: 32, suffix: '', label: t('landing.resources.stats.partners') },
    { value: 3, suffix: '', label: t('landing.resources.stats.offices') },
  ]

  return (
    <>
      <SEOHead
        title={t('landing.resources.seo_title')}
        description={t('landing.resources.seo_description')}
        keywords="recursos sistema maquiadora, funcionalidades CRM beauty, agenda maquiadora, contrato digital"
        url="https://khaoskontrol.com.br/recursos"
        breadcrumbs={[
          { name: t('SIDEBAR_DASHBOARD'), url: 'https://khaoskontrol.com.br/' },
          { name: t('header_features'), url: 'https://khaoskontrol.com.br/recursos' },
        ]}
      />
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        {}
        <div className="fixed top-[-15%] left-[-10%] w-[45%] h-[45%] bg-foreground/[0.015] blur-[180px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-foreground/[0.02] blur-[180px] rounded-full pointer-events-none" />

        {}
        <section className="relative pt-40 pb-24 border-b border-border/40">
          {}
          <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
            <img
              src="/khaos-uploads/734febb0-c2fc-4623-98e2-bbe5a386408f.png"
              alt="Background Texture"
              className="w-full h-full object-cover grayscale brightness-50"
            />
          </div>

          <div className="container mx-auto px-6 lg:px-10 relative z-10 text-center">
            <div className="max-w-4xl mx-auto space-y-8 text-center">
              <SectionHeader
                eyebrow={t('landing.resources.eyebrow')}
                title={t('landing.resources.title')}
                subtitle={t('landing.resources.subtitle')}
                centered={true}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex items-center gap-4 justify-center"
              >
                <Link to="/planos">
                  <Button className="h-11 px-7 rounded-full text-sm font-medium group">
                    {t('landing.resources.choose_plan')}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/contato">
                  <Button
                    variant="outline"
                    className="h-11 px-7 rounded-full border-border text-foreground hover:bg-accent text-sm font-medium"
                  >
                    {t('landing.resources.contact_us')}
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
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="text-center md:text-left flex flex-col items-center md:items-start"
                >
                  <p className="font-serif text-6xl md:text-8xl text-foreground">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-4 font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {}
        <section className="py-24 border-b border-border/40 relative bg-transparent">
          <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay">
            <img
              src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=2000&auto=format&fit=crop"
              alt="Background Texture"
              className="w-full h-full object-cover grayscale brightness-50"
            />
          </div>
          <div className="container mx-auto px-6 lg:px-10 text-center relative z-10">
            <div className="max-w-3xl mx-auto space-y-6 text-center">
              <span className="text-xs text-muted-foreground tracking-widest uppercase">
                {t('landing.resources.about_eyebrow')}
              </span>
              <h2 className="font-serif text-4xl md:text-6xl text-foreground tracking-tight leading-[1.05]">
                {t('landing.resources.about_title').split('plataforma')[0]} 
                <span className="italic font-serif">plataforma</span>
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
                {t('landing.resources.about_description')}
              </p>
            </div>
          </div>
        </section>

        {}
        <section className="py-24 border-t border-border/40">
          <div className="container mx-auto px-6 lg:px-10">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8 text-left">
              <div className="space-y-4">
                <span className="text-xs text-muted-foreground tracking-widest uppercase">
                  {t('header_features')}
                </span>
                <h2 className="font-serif text-4xl md:text-6xl text-foreground tracking-tight leading-[1.05]">
                  Nossos <span className="italic font-serif">Recursos</span>
                </h2>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  {t('landing.resources.features_subtitle')}
                </p>
              </div>
              <Link to="/contato">
                <Button
                  variant="outline"
                  className="h-11 px-7 rounded-full border-border text-foreground hover:bg-foreground hover:text-background text-sm font-medium group transition-all"
                >
                  {t('landing.resources.contact_us')}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.6 }}
                  whileHover={{ y: -4 }}
                  className="p-8 rounded-[2.5rem] border border-border bg-card hover:bg-accent transition-all duration-500 group text-left"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 flex items-center text-muted-foreground group-hover:text-foreground transition-colors duration-500">
                      <service.icon className="w-8 h-8" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-medium text-foreground">
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
        <section className="py-32 border-t border-border/40">
          <div className="container mx-auto px-6 lg:px-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto space-y-8 text-center"
            >
              <span className="text-xs text-muted-foreground tracking-widest uppercase">
                {t('landing.resources.special_offer_eyebrow')}
              </span>
              <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-foreground tracking-tight leading-[1.05]">
                {t('landing.resources.special_offer_title')}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                {t('landing.resources.special_offer_description')}
              </p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <Link to="/planos">
                  <Button className="h-12 px-8 rounded-full text-sm font-medium group">
                    {t('landing.resources.start_now')}
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

