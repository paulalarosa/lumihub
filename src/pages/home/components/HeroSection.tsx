import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { TypewriterText } from './TypewriterText'
import { useLanguage } from '@/hooks/useLanguage'

export const HeroSection = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center bg-background overflow-hidden noise-overlay"
    >
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute right-0 top-0 w-full md:w-1/2 h-full opacity-20 pointer-events-none z-0"
          style={{ y }}
        >
          <img
            src="/assets/hero-image-B5FCqZ87.png"
            alt="Hero Background"
            className="w-full h-full object-cover grayscale contrast-125"
            fetchPriority="high"
          />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent z-10" />
      </div>

      <motion.div
        className="container mx-auto px-6 md:px-16 relative z-30 max-w-7xl pt-20"
        style={{ y, opacity }}
      >
        <motion.div
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-foreground/5 border border-border backdrop-blur-md no-round"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
          <span className="text-muted-foreground text-[10px] font-mono uppercase tracking-[0.3em]">
            {t('landing.hero.badge')}
          </span>
        </motion.div>

        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-foreground leading-[0.9] mb-4 tracking-tighter">
            <TypewriterText text={t('landing.hero.title_line1')} />
          </h1>
          <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-foreground/90 leading-[0.9] tracking-tighter italic">
            <TypewriterText
              text={t('landing.hero.title_line2')}
              delayOffset={t('landing.hero.title_line1').length * 0.04}
            />
          </h1>
        </motion.div>

        <motion.div
          className="w-full h-[1px] bg-border mb-12 max-w-4xl"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          style={{ transformOrigin: 'left' }}
        />

        <motion.p
          className="text-muted-foreground text-base md:text-lg max-w-xl mb-12 leading-relaxed font-mono uppercase tracking-widest"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          {t('landing.hero.subtitle')}
        </motion.p>

        <div className="flex flex-col sm:flex-row gap-6">
          <Button
            variant="primary"
            size="lg"
            className="hero-btn group"
            onClick={() => navigate('/cadastro')}
          >
            {t('landing.hero.cta_primary')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button variant="glass" size="lg" onClick={() => navigate('/planos')}>
            {t('landing.hero.cta_secondary')}
            <ArrowUpRight className="w-5 h-5 opacity-50" />
          </Button>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-10 left-6 md:left-16 flex items-center gap-4 z-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground/40 text-[10px] font-mono vertical-rl tracking-[.5em] rotate-180 uppercase">
            {t('landing.hero.scroll')}
          </span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-foreground to-transparent" />
        </div>
      </motion.div>
    </section>
  )
}
