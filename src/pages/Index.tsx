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
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import SEOHead from '@/components/seo/SEOHead'
import Header from '@/components/ui/layout/Header'
import Footer from '@/components/ui/layout/Footer'
import AIAssistantFAB from '@/features/ai/components/AIAssistantFAB'
import { TestimonialsSection } from '@/pages/home/components/TestimonialsSection'

import { AnimatedCounter } from '@/components/ui/animated-counter'

const features = [
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
      'Área exclusiva para suas clientes acompanharem contratos, agenda e briefings. Experiência premium.',
  },
]

const processSteps = [
  {
    number: '1',
    title: 'Defina sua Visão',
    description:
      'Encontre o plano perfeito adaptado às suas necessidades, com o equilíbrio certo de recursos e flexibilidade para alcançar seus objetivos.',
  },
  {
    number: '2',
    title: 'Configure sua Plataforma',
    description:
      'Personalize seu portal, configure seus serviços e comece a cadastrar seus clientes com nossas ferramentas intuitivas.',
  },
  {
    number: '3',
    title: 'Comece a Operar',
    description:
      'Com tudo configurado, gerencie agendamentos, contratos e finanças em um só lugar — com precisão e eficiência.',
  },
]

const marqueeItems1 = [
  'Agenda Inteligente',
  'Contratos Digitais',
  'CRM Completo',
  'Moodboard Digital',
  'Portal do Cliente',
  'Analytics',
]
const marqueeItems2 = [
  'Dashboard Financeiro',
  'Comissionamento',
  'Gestão de Equipe',
  'Anamnese Digital',
  'Briefing Visual',
  'Multi-usuário',
]

const Home = () => {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <>
      <SEOHead
        title="KHAOS KONTROL"
        description="Gerencie clientes, agenda, contratos e finanças em uma plataforma elegante. Economize 10+ horas por semana e aumente sua receita em até 40%. Teste grátis por 14 dias."
        keywords="gestão para maquiadores, agenda de beleza, sistema para profissionais de beleza, contratos digitais, gestão de clientes, maquiadora profissional, software para salão, sistema para noivas, khaos kontrol system"
        url="https://khaoskontrol.com.br"
        breadcrumbs={[{ name: 'Home', url: 'https://khaoskontrol.com.br' }]}
        faq={[
          {
            question: 'O que é o KHAOS KONTROL?',
            answer:
              'KHAOS KONTROL é uma plataforma completa de gestão para profissionais de beleza, incluindo agenda, contratos digitais, gestão financeira e portal do cliente.',
          },
          {
            question: 'Quanto custa o KHAOS KONTROL?',
            answer:
              'O KHAOS KONTROL oferece planos a partir de R$39,90/mês com teste gratuito de 14 dias sem necessidade de cartão de crédito.',
          },
          {
            question: 'Posso cancelar a qualquer momento?',
            answer:
              'Sim! Não há contratos de fidelidade. Você pode cancelar sua assinatura quando quiser.',
          },
          {
            question: 'O KHAOS KONTROL funciona para salões de beleza?',
            answer:
              'Sim! O KHAOS KONTROL é ideal para maquiadoras, cabeleireiras, nail designers e qualquer profissional de beleza.',
          },
        ]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'KHAOS KONTROL',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description:
            'Plataforma de gestão completa para profissionais de beleza',
          url: 'https://khaoskontrol.com.br',
          image: 'https://khaoskontrol.com.br/og-image.png',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'BRL',
            description: 'Teste gratuito por 14 dias',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '1000',
            bestRating: '5',
          },
          featureList: [
            'Gestão de Clientes',
            'Agenda Inteligente',
            'Contratos Digitais',
            'Portal do Cliente',
            'Dashboard Financeiro',
            'Gestão de Equipe',
          ],
        }}
      />
      <Header />
      <div className="relative min-h-screen bg-black page-transition overflow-x-hidden pt-16">
        <section
          ref={heroRef}
          className="relative min-h-[calc(100vh-64px)] px-6 md:px-16 pt-24 pb-16 overflow-hidden
                     bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-black to-black"
        >
          <div
            className="absolute inset-0 z-10 opacity-[0.05] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}
          />

          <div className="container mx-auto relative z-20 h-full">
            <div className="grid md:grid-cols-2 gap-12 items-center h-full">
              <motion.div
                className="flex flex-col items-start text-left w-full h-full justify-center"
                style={{ y, opacity }}
              >
                <motion.div
                  className="inline-block mb-8 px-4 py-2 border border-white/20 backdrop-blur-sm bg-white/5 rounded-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="text-white/80 text-[10px] font-mono uppercase tracking-widest">
                    KHAOS KONTROL 2.0
                  </span>
                </motion.div>

                <div className="mb-8 select-none">
                  <motion.h1
                    className="text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-serif tracking-tight text-white leading-[0.9] mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    ORDEM NO
                  </motion.h1>
                  <motion.h1
                    className="text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-serif tracking-tight text-white leading-[0.9] italic"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    MEIO DO KHAOS.
                  </motion.h1>
                </div>

                <motion.p
                  className="text-white/60 text-base md:text-lg max-w-xl mb-12 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  GESTÃO MINIMALISTA PARA PROFISSIONAIS QUE NÃO ACEITAM O
                  BÁSICO. CONTROLE TOTAL DA SUA CARREIRA EM PRETO E BRANCO.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  <Link to="/auth">
                    <Button
                      variant="default"
                      size="lg"
                      className="group uppercase"
                    >
                      Iniciar Sistema
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="ml-2"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                className="hidden md:flex h-full relative items-center justify-center w-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.4 }}
              >
                <img
                  src="/khaos-uploads/734febb0-c2fc-4623-98e2-bbe5a386408f.png"
                  alt="Professional Makeup"
                  className="w-full h-auto max-h-[85vh] object-cover object-top mix-blend-lighten"
                  style={{
                    maskImage:
                      'linear-gradient(to bottom, black 40%, transparent)',
                    WebkitMaskImage:
                      'linear-gradient(to bottom, black 40%, transparent)',
                  }}
                />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 overflow-hidden bg-black/50 backdrop-blur-sm">
          <div className="py-5 flex items-center gap-10 animate-marquee whitespace-nowrap">
            {[
              ...marqueeItems1,
              ...marqueeItems1,
              ...marqueeItems1,
              ...marqueeItems1,
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-4">
                <span className="text-xs tracking-widest uppercase text-white/30 font-medium">
                  {item}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
              </span>
            ))}
          </div>
          <div className="border-t border-white/5 py-5 flex items-center gap-10 animate-marquee-reverse whitespace-nowrap">
            {[
              ...marqueeItems2,
              ...marqueeItems2,
              ...marqueeItems2,
              ...marqueeItems2,
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-4">
                <span className="text-xs tracking-widest uppercase text-white/20 font-medium">
                  {item}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/10" />
              </span>
            ))}
          </div>
        </section>

        <section className="py-32 relative bg-black">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[300px] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-6 lg:px-10 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
              <div className="lg:sticky lg:top-32 space-y-6 text-left">
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-xs text-muted-foreground tracking-widest uppercase"
                >
                  Como funciona
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05]"
                >
                  Processo <span className="italic font-serif">simples</span>
                  <br />
                  para resultados{' '}
                  <span className="italic font-serif">reais</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-sm text-muted-foreground max-w-md leading-relaxed"
                >
                  Criando soluções visuais que inspiram e elevam marcas com
                  processos estratégicos e bem definidos.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-4 pt-4"
                >
                  <div className="mt-8 pt-8 border-t border-white/10 hidden xl:block">
                    <Button className="h-11 px-7 rounded-full text-sm font-medium">
                      Conhecer Funcionalidades
                    </Button>
                  </div>
                  <Link to="/recursos">
                    <Button
                      variant="outline"
                      className="h-11 px-7 rounded-full border-white/10 text-white hover:bg-white/5 text-sm font-medium"
                    >
                      Ver Recursos
                    </Button>
                  </Link>
                </motion.div>
              </div>

              <div className="space-y-6">
                {processSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15, duration: 0.6 }}
                    className="group relative p-8 md:p-10 rounded-[1.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 text-left"
                  >
                    <div className="flex items-start gap-6">
                      <div className="text-5xl font-serif text-white/5 group-hover:text-white/10 transition-colors leading-none">
                        {step.number}
                      </div>
                      <div className="space-y-3 pt-1">
                        <h3 className="text-lg font-medium text-white">
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 border-t border-white/5 relative bg-transparent">
          <div className="absolute bottom-0 right-[-10%] w-[40%] h-[400px] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-6 lg:px-10 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-16 text-left">
              <div className="space-y-4">
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-xs text-muted-foreground tracking-widest uppercase"
                >
                  Nossos Recursos
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05]"
                >
                  Tudo que você precisa
                  <br />
                  <span className="italic font-serif text-white/80">
                    em um só lugar
                  </span>
                </motion.h2>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <Link to="/recursos">
                  <Button
                    variant="outline"
                    className="h-11 px-7 rounded-full border-white/10 text-white hover:bg-white/5 text-sm font-medium group"
                  >
                    Ver Todos
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.6 }}
                  whileHover={{ y: -4 }}
                  className="p-8 rounded-[1.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 group text-left"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 flex items-center text-white/40 group-hover:text-white transition-colors duration-500">
                      <feature.icon className="w-8 h-8" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-medium text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 border-y border-white/5 bg-black/30">
          <div className="container mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              {[
                {
                  value: 10,
                  suffix: '+',
                  label: 'Horas Economizadas / Semana',
                },
                { value: 40, suffix: '%', label: 'Aumento na Receita Média' },
                {
                  value: 98,
                  suffix: '%',
                  label: 'Satisfação e Retenção de Clientes',
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.8 }}
                  className="text-center flex flex-col items-center justify-center p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.02]"
                >
                  <p className="font-serif text-6xl md:text-7xl lg:text-8xl text-white tracking-tighter">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40 mt-6 max-w-[200px] leading-relaxed font-medium">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12 block md:hidden">
              <Link to="/planos">
                <Button
                  variant="outline"
                  className="h-11 px-7 rounded-full border-white/10 text-white hover:bg-white/5 text-sm font-medium"
                >
                  Ver Todos Recursos <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <TestimonialsSection />

        <section className="py-32 border-t border-white/5 relative bg-transparent">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-white/[0.03] blur-[180px] rounded-full" />
          </div>

          <div className="container mx-auto px-6 lg:px-10 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <span className="text-xs text-muted-foreground tracking-widest uppercase">
                Comece Agora
              </span>
              <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white tracking-tight leading-[1.05]">
                Transforme seu
                <br />
                negócio{' '}
                <span className="italic font-serif text-white/80">hoje</span>
              </h2>
              <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                Comece gratuitamente e descubra como o KONTROL pode revolucionar
                a gestão do seu negócio de beleza.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link to="/planos">
                  <Button className="h-12 px-8 rounded-full text-sm font-medium group">
                    Começar Gratuitamente
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/contato">
                  <Button
                    variant="outline"
                    className="h-12 px-8 rounded-full border-white/10 text-white hover:bg-white/5 text-sm font-medium"
                  >
                    Fale Conosco
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <AIAssistantFAB />
        <Footer />
      </div>
    </>
  )
}

export default Home
