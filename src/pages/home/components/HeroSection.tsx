import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'

export const HeroSection = () => {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center bg-black overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute right-0 top-0 w-full md:w-1/2 h-full opacity-15 pointer-events-none"
          style={{ y }}
        >
          <img
            src="/assets/hero-image-B5FCqZ87.png"
            alt=""
            className="w-full h-full object-cover grayscale contrast-125"
            fetchPriority="high"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40 z-10" />
      </div>

      <motion.div
        className="container mx-auto px-6 md:px-16 relative z-30 max-w-6xl pt-20"
        style={{ y, opacity }}
      >
        {/* Social proof badge */}
        <motion.div
          className="inline-flex items-center gap-2 mb-10 px-4 py-2 border border-white/10 bg-white/[0.03]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-5 h-5 rounded-full bg-white/20 border border-black" />
            ))}
          </div>
          <span className="text-white/60 text-xs">
            Usado por <span className="text-white">+200 profissionais</span> de beleza
          </span>
        </motion.div>

        {/* Headline — StoryBrand: problema + solução em 1 frase */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-tight">
            Pare de perder clientes
          </h1>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white/70 leading-[0.95] tracking-tight italic mt-1">
            por falta de organização.
          </h1>
        </motion.div>

        {/* Subheadline — StoryBrand: o guia + o plano */}
        <motion.p
          className="text-white/45 text-base md:text-lg max-w-xl mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          O Khaos Kontrol organiza seus clientes, contratos, agenda e financeiro
          em um só lugar — para você focar no que faz de melhor.
        </motion.p>

        {/* Value props — 3 benefícios rápidos */}
        <motion.div
          className="flex flex-col sm:flex-row gap-6 mb-12 text-sm text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="flex items-center gap-2">
            <div className="w-1 h-1 bg-white/60" />
            Agenda integrada com Google
          </span>
          <span className="flex items-center gap-2">
            <div className="w-1 h-1 bg-white/60" />
            Contratos com assinatura digital
          </span>
          <span className="flex items-center gap-2">
            <div className="w-1 h-1 bg-white/60" />
            Portal exclusivo para noivas
          </span>
        </motion.div>

        {/* CTA — StoryBrand: chamada direta + alternativa */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            variant="primary"
            size="lg"
            className="group"
            onClick={() => navigate('/cadastro')}
          >
            Começar grátis por 14 dias
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button
            variant="glass"
            size="lg"
            onClick={() => {
              const el = document.getElementById('como-funciona')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <Play className="w-4 h-4 mr-1" />
            Ver como funciona
          </Button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="w-[1px] h-10 bg-gradient-to-b from-white/30 to-transparent"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </motion.div>
    </section>
  )
}
