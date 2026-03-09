import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  Rocket,
  ArrowUpRight,
  BarChart3,
  ShieldCheck,
  Clock,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import { Button } from '@/components/ui/Button'
import Header from '@/components/ui/layout/Header'
import Footer from '@/components/ui/layout/Footer'

const TypewriterText = ({
  text,
  delayOffset = 0,
}: {
  text: string
  delayOffset?: number
}) => {
  return (
    <>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delayOffset + index * 0.04, duration: 0.1 }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div className="min-h-screen bg-black overflow-hidden font-inter selection:bg-white/20 selection:text-white">
      <Header />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center bg-black overflow-hidden noise-overlay"
      >
        {/* Background Image + Overlays */}
        <div className="absolute inset-0 z-0">
          {/* Camada 1: Container Base com 20% de opacidade e Parallax */}
          <motion.div
            className="absolute right-0 top-0 w-full md:w-1/2 h-full opacity-20 pointer-events-none z-0"
            style={{ y }}
          >
            {/* Camada 3: A Imagem Texturizada */}
            <img
              src="/assets/hero-image-B5FCqZ87.png"
              alt="Hero Background"
              className="w-full h-full object-cover grayscale contrast-125"
              fetchPriority="high"
            />
          </motion.div>

          {/* Camada 2: Overlay de Gradiente */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent z-10" />
        </div>

        {/* Content */}
        <motion.div
          className="container mx-auto px-6 md:px-16 relative z-30 max-w-7xl pt-20"
          style={{ y, opacity }}
        >
          {/* Version Badge */}
          <motion.div
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-white/5 border border-white/10 backdrop-blur-md no-round"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white/80 text-[10px] font-mono uppercase tracking-[0.3em]">
              KONTROL_SYSTEM_V.2.9
            </span>
          </motion.div>

          {/* Headlines */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-white leading-[0.9] mb-4 tracking-tighter">
              <TypewriterText text="O BACKSTAGE" />
            </h1>
            <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-white leading-[0.9] tracking-tighter">
              <TypewriterText
                text="DO SEU IMPÉRIO."
                delayOffset={'O BACKSTAGE'.length * 0.04}
              />
            </h1>
          </motion.div>

          <motion.div
            className="w-full h-[1px] bg-white/20 mb-12 max-w-4xl"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            style={{ transformOrigin: 'left' }}
          />

          <motion.p
            className="text-white/50 text-base md:text-lg max-w-xl mb-12 leading-relaxed font-mono uppercase tracking-widest"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            SISTEMA DE GESTÃO ABSOLUTA PARA PROFISSIONAIS QUE DOMINAM O KHAOS.
            TRANSFORME TALENTO EM EXECUÇÃO MILIMÉTRICA.
          </motion.p>

          <div className="flex flex-col sm:flex-row gap-6">
            <Button
              variant="primary"
              size="lg"
              className="hero-btn group"
              onClick={() => navigate('/cadastro')}
            >
              INICIAR_SISTEMA
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              variant="glass"
              size="lg"
              onClick={() => navigate('/planos')}
            >
              VER PLANOS
              <ArrowUpRight className="w-5 h-5 opacity-50" />
            </Button>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-10 left-6 md:left-16 flex items-center gap-4 z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <div className="flex flex-col gap-2">
            <span className="text-white/20 text-[10px] font-mono vertical-rl tracking-[.5em] rotate-180 uppercase">
              Scroll
            </span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent" />
          </div>
        </motion.div>
      </section>

      {/* Key Numbers Section */}
      <section className="py-24 bg-black border-y border-white/5 relative z-20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left">
            {[
              { label: 'CLIENTES ATIVOS', value: '+5K' },
              { label: 'CONTRATOS GERADOS', value: '12K' },
              { label: 'UPTIME SISTEMA', value: '99.9%' },
              { label: 'PROJETOS GERIDOS', value: '8.4K' },
            ].map((stat, i) => (
              <div key={i} className="group">
                <p className="text-8xl font-bold text-white/10 group-hover:text-white/20 transition-colors mb-2">
                  {stat.value}
                </p>
                <p className="text-[10px] font-mono text-white/40 tracking-[0.3em]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-40 bg-black relative">
        <div className="container mx-auto px-6 md:px-16 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-20 items-end mb-32">
            <div>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-10 tracking-tight leading-tight">
                Processos{' '}
                <span className="font-serif italic font-normal">simples</span>
                <br />
                para impérios{' '}
                <span className="font-serif italic font-normal">reais</span>
              </h2>
              <p className="text-white/50 text-lg md:text-xl max-w-md leading-relaxed font-mono uppercase tracking-wider">
                Automatizamos o que é mecânico para que você foque no que é
                artístico.
              </p>
            </div>
            <div className="flex justify-end">
              <div className="p-8 glass-strong rounded-3xl max-w-sm">
                <Clock className="w-12 h-12 text-white mb-6" />
                <h3 className="text-xl font-bold text-white mb-4">
                  Economize 15h+ semanais
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Elimine tarefas repetitivas com nossa IA operativa e
                  automações inteligentes de contrato.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: 'Analytics Noir',
                desc: 'Dashboard em alto contraste com métricas vitais da sua carreira em tempo real.',
              },
              {
                icon: ShieldCheck,
                title: 'Legal Kontrol',
                desc: 'Gerador de contratos com validade jurídica e assinatura digital integrada.',
              },
              {
                icon: Rocket,
                title: 'Vendas Pro',
                desc: 'CRM minimalista focado em converter leads em faturamento recorrente.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="p-10 card group hover:scale-[1.02] transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <feature.icon className="w-10 h-10 text-white mb-8 opacity-40 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-3xl -z-10" />
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h2 className="text-5xl md:text-8xl font-bold text-white mb-8 tracking-tighter">
            DOMINE O{' '}
            <span className="font-serif italic font-normal">KHAOS</span>
          </h2>
          <p className="text-white/40 text-lg mb-12 font-mono uppercase tracking-[0.2em] max-w-2xl mx-auto">
            Não é sobre trabalhar mais. É sobre ter kontrole absoluto sobre o
            que você cria.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="px-16"
            onClick={() => navigate('/cadastro')}
          >
            INICIAR_SISTEMA_AGORA
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
