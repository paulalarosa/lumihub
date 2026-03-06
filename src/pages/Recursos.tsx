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
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'
import SEOHead from '@/components/seo/SEOHead'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { SectionHeader } from '@/components/ui/SectionHeader'

const services = [
  {
    icon: Calendar,
    title: 'Agenda Inteligente',
    description:
      'Gerencie seus agendamentos com visão completa de calendário. Sincronize com Google Calendar e receba lembretes automáticos.',
  },
  {
    icon: Users,
    title: 'Gestão de Clientes',
    description:
      'CRM completo para profissionais de beleza. Histórico, anamnese, preferências e portal exclusivo para cada cliente.',
  },
  {
    icon: FileText,
    title: 'Contratos Digitais',
    description:
      'Crie, envie e colete assinaturas digitais dos seus contratos. Tudo automatizado e juridicamente válido.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Financeiro',
    description:
      'Acompanhe receitas, despesas, comissões e projeções. Relatórios detalhados para tomar decisões inteligentes.',
  },
  {
    icon: Palette,
    title: 'Moodboard & Briefing',
    description:
      'Colete referências visuais e informações detalhadas de cada projeto. Compartilhe com o cliente pelo portal.',
  },
  {
    icon: Shield,
    title: 'Portal do Cliente',
    description:
      'Área exclusiva para suas clientes acompanharem contratos, agenda e briefings. Experiência premium e profissional.',
  },
]

const stats = [
  { value: 100, suffix: '+', label: 'Projetos Realizados' },
  { value: 32, suffix: '', label: 'Parceiros Globais' },
  { value: 3, suffix: '', label: 'Escritórios' },
]

export default function RecursosPage() {
  return (
    <>
      <SEOHead
        title="Recursos & Funcionalidades | KHAOS KONTROL"
        description="Explore todas as ferramentas de gestão do KHAOS KONTROL. De agenda inteligente a contratos digitais, tudo em um só lugar."
      />
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="fixed top-[-15%] left-[-10%] w-[45%] h-[45%] bg-white/[0.015] blur-[180px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-white/[0.02] blur-[180px] rounded-full pointer-events-none" />

        {/* Hero */}
        <section className="relative pt-40 pb-24 border-b border-white/5">
          {/* Textured Overlay Image */}
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
                eyebrow="CAPACIDADES DO SISTEMA"
                title="PROJETADO PARA ALTA PERFORMANCE"
                subtitle="Desbloqueie seu potencial digital com o KHAOS KONTROL. Oferecemos soluções completas em gestão, agendamento, contratos e analytics para elevar sua presença profissional."
                centered={false}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex items-center gap-4 justify-center"
              >
                <Link to="/planos">
                  <Button className="h-11 px-7 rounded-full text-sm font-medium group">
                    Escolher Plano
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/contato">
                  <Button
                    variant="outline"
                    className="h-11 px-7 rounded-full border-white/10 text-white hover:bg-white/5 text-sm font-medium"
                  >
                    Fale Conosco
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Stats */}
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

        {/* About */}
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
                Sobre
              </span>
              <h2 className="font-serif text-4xl md:text-6xl text-white tracking-tight leading-[1.05]">
                Sobre a <span className="italic font-serif">plataforma</span>
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                O KHAOS KONTROL é uma plataforma de gestão de alta performance
                dedicada a transformar suas operações digitais em realidade. Com
                foco em criatividade e inovação, nos especializamos em criar
                soluções que captam audiências e geram resultados tangíveis em
                um mercado extremamente competitivo.
                <br />
                <br />
                Nosso ecossistema foi desenhado meticulosamente para
                profissionais da beleza que não abrem mão de uma estética
                luxuosa e uma performance implacável. Desde o momento do
                agendamento à gestão analítica de lucros, nossa interface fluida
                e intuitiva garante que você permaneça focado exclusivamente na
                sua arte.
              </p>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-24 border-t border-white/5">
          <div className="container mx-auto px-6 lg:px-10">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8 text-left">
              <div className="space-y-4">
                <span className="text-xs text-muted-foreground tracking-widest uppercase">
                  Recursos
                </span>
                <h2 className="font-serif text-4xl md:text-6xl text-white tracking-tight leading-[1.05]">
                  Nossos <span className="italic font-serif">Recursos</span>
                </h2>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  Explore nosso arsenal de ferramentas, projetadas para elevar
                  sua presença digital e impulsionar resultados.
                </p>
              </div>
              <Link to="/contato">
                <Button
                  variant="outline"
                  className="h-11 px-7 rounded-full border-white/10 text-white hover:bg-white hover:text-black text-sm font-medium group transition-all"
                >
                  Fale Conosco
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

        {/* CTA */}
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
                Oferta Especial
              </span>
              <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white tracking-tight leading-[1.05]">
                Oferta Especial
                <br />
                <span className="italic font-serif">para Novos Clientes</span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Estamos oferecendo condições especiais para novos profissionais.
                Eleve seu negócio com nossas soluções personalizadas.
              </p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <Link to="/planos">
                  <Button className="h-12 px-8 rounded-full text-sm font-medium group">
                    Começar
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
