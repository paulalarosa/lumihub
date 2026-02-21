import { Link } from 'react-router-dom'
import {
  motion,
  useScroll as useFramerScroll,
  useTransform,
} from 'framer-motion'
import { useScroll, useParallax } from '@/hooks/useScroll'
import { useLanguage } from '@/hooks/useLanguage'
import SplitText from '@/components/reactbits/SplitText'
import DecryptedText from '@/components/reactbits/DecryptedText'
import heroImage from '@/assets/hero-image.png'

export function HeroSection() {
  const { t } = useLanguage()
  const { scrollY } = useScroll()
  const imageY = useParallax(scrollY, [0, 500], [0, 150])
  const { scrollYProgress } = useFramerScroll()
  const _heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const _heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95])

  return (
    <section className="relative min-h-screen flex items-center bg-black overflow-hidden bg-noise">
      <motion.div
        style={{ y: imageY }}
        className="absolute right-0 top-0 w-full md:w-1/2 h-full opacity-20 pointer-events-none z-0"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent z-10" />
        <img
          src={heroImage}
          alt="Hero Texture"
          className="w-full h-full object-cover grayscale contrast-125"
        />
      </motion.div>

      <div className="absolute inset-0 noir-grid-lines opacity-20 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl"
        >
          <div className="inline-block border border-white px-3 py-1 mb-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white">
              {t('hero_badge')}
            </span>
          </div>

          <SplitText
            text={t('hero_title')
              .replace('BACKSTAGE', 'BACKSTAGE\n')
              .replace('IMPÉRIO', 'IMPÉRIO')}
            className="font-serif text-6xl md:text-8xl lg:text-9xl text-white leading-[0.9] tracking-tighter mb-12 whitespace-pre-line"
            delay={40}
            duration={1.5}
            tag="h1"
          />

          <div className="flex flex-col md:flex-row items-start md:items-center gap-12 border-t border-white/20 pt-12">
            <Link to="/register">
              <button
                className="noir-button text-sm w-full md:w-auto"
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    ;(window as any).gtag('event', 'generate_lead', {
                      event_category: 'conversion',
                      event_label: 'hero_cta',
                    })
                  }
                }}
              >
                {t('cta_start')} -&gt;
              </button>
            </Link>

            <p className="font-mono text-xs text-white/60 max-w-sm uppercase tracking-wide leading-relaxed">
              {t('hero_subtitle')}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="absolute top-0 right-0 p-8 hidden md:block">
        <div className="font-mono text-[10px] text-white/40 text-right space-y-2">
          <DecryptedText
            text={t('hero_status_online')}
            animateOn="view"
            revealDirection="end"
            speed={100}
            maxIterations={20}
            characters="XY01"
            className="text-emerald-500"
          />
          <DecryptedText
            text={t('hero_loc')}
            animateOn="view"
            revealDirection="end"
            delay={500}
            characters="LOC_LAT_LNG"
          />
          <p>
            TIME:{' '}
            {new Date().toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <div className="absolute bottom-8 left-8 hidden md:block">
        <div className="w-32 h-32 border border-white/20 rounded-full flex items-center justify-center animate-spin-slow">
          <div className="w-full h-[1px] bg-white/20" />
          <div className="absolute h-full w-[1px] bg-white/20" />
        </div>
      </div>
    </section>
  )
}
