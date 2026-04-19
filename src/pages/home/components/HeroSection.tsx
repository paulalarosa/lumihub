import { ArrowRight, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useLanguage } from '@/hooks/useLanguage'
import { useIsMobile } from '@/hooks/use-mobile'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

export const HeroSection = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { trackCTAClick } = useAnalytics()
  const isMobile = useIsMobile()
  const heroRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!heroRef.current || !bgRef.current || !contentRef.current) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })

    tl.to(bgRef.current, { scale: 1.5, ease: 'none' }, 0)
    tl.to(contentRef.current, { y: 100, opacity: 0, scale: 0.9, ease: 'none' }, 0)

    gsap.from('.hero-reveal', {
      y: 40,
      opacity: 0,
      stagger: 0.1,
      duration: 1.2,
      ease: 'power4.out',
      delay: 0.2,
    })
  }, { scope: heroRef })

  return (
    <section
      ref={heroRef}
      className="relative min-h-[120vh] flex items-center bg-black overflow-hidden parallax-container"
    >
      <div ref={bgRef} className="absolute inset-0 z-0">
        <div className="absolute right-0 top-0 w-full md:w-[55%] h-full pointer-events-none">
          <img
            src="/assets/hero-image-B5FCqZ87.png"
            alt=""
            className="w-full h-full object-cover grayscale contrast-125 scale-110 opacity-55"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/25 to-transparent" />
          <div
            className="absolute inset-0 bg-gradient-to-l from-black/60 via-transparent to-transparent"
            style={{ width: '30%', left: 'auto', right: 0 }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black from-20% via-black/70 to-transparent" />
      </div>

      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/70 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none" />

      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ opacity: 0.12, mixBlendMode: 'overlay' }}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <filter id="hero-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-grain)" />
      </svg>

      <div
        ref={contentRef}
        className="container mx-auto px-6 md:px-16 relative z-30 max-w-6xl pt-20"
      >
        <div className="hero-reveal inline-flex items-center gap-2 mb-10 px-4 py-2 border border-white/10 bg-white/[0.03]">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full bg-white/20 border border-black"
              />
            ))}
          </div>
          <span className="text-white/60 text-xs">
            {t('home.hero.eyebrow', { count: 200 })}
          </span>
        </div>

        <div className="hero-reveal mb-8">
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-wide">
            {t('home.hero.title_1')}
          </h1>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white/70 leading-[0.95] tracking-wide italic mt-1">
            {t('home.hero.title_2')}
          </h1>
        </div>

        <p className="hero-reveal text-white/45 text-base md:text-lg max-w-xl mb-10 leading-relaxed">
          {t('home.hero.subtitle')}
        </p>

        <div className="hero-reveal flex flex-col sm:flex-row gap-6 mb-12 text-sm text-white/40">
          <span className="flex items-center gap-2">
            <div className="w-1 h-1 bg-white/60" />
            {t('home.hero.features.google')}
          </span>
          <span className="flex items-center gap-2">
            <div className="w-1 h-1 bg-white/60" />
            {t('home.hero.features.contracts')}
          </span>
          <span className="flex items-center gap-2">
            <div className="w-1 h-1 bg-white/60" />
            {t('home.hero.features.portal')}
          </span>
        </div>

        <div className="hero-reveal flex flex-col sm:flex-row gap-4">
          <Button
            variant="primary"
            size={isMobile ? 'default' : 'lg'}
            className="group"
            onClick={() => {
              trackCTAClick('hero_signup', 'hero_section', '/cadastro')
              navigate('/cadastro')
            }}
          >
            {t('home.hero.cta_start')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button
            variant="glass"
            size={isMobile ? 'default' : 'lg'}
            onClick={() => {
              trackCTAClick('hero_how_it_works', 'hero_section', '#como-funciona')
              const el = document.getElementById('como-funciona')
              if (el) {
                window.scrollTo({ top: el.offsetTop, behavior: 'smooth' })
              }
            }}
          >
            <Play className="w-4 h-4 mr-1" />
            {t('home.hero.cta_how_it_works')}
          </Button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 opacity-50">
        <div className="w-[1px] h-10 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
      </div>
    </section>
  )
}
