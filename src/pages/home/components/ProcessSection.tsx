import { useRef } from 'react'
import {
  MessageCircle,
  FileCheck2,
  PieChart,
  Sparkles,
  Clock,
  TrendingUp
} from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export const ProcessSection = () => {
  const { t } = useLanguage()
  const sectionRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!sectionRef.current || !containerRef.current) return

    gsap.fromTo('.process-header',
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.process-header',
          start: 'top 90%',
        }
      }
    )

    const cards = gsap.utils.toArray<HTMLElement>('.process-card')
    gsap.fromTo(cards,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: '.process-card',
          start: 'top 95%',
          toggleActions: 'play none none reverse',
        }
      }
    )

    ScrollTrigger.refresh()
  }, { scope: sectionRef })

  const processes = [
    { icon: MessageCircle, id: 'management' },
    { icon: FileCheck2, id: 'legal' },
    { icon: PieChart, id: 'financial' },
    { icon: Sparkles, id: 'experience' },
    { icon: Clock, id: 'automation' },
    { icon: TrendingUp, id: 'growth' },
  ]

  return (
    <section
      id="como-funciona"
      ref={sectionRef}
      className="relative py-24 bg-black overflow-hidden"
    >
      <div
        ref={containerRef}
        className="container mx-auto px-6 lg:px-16 relative z-10"
      >
        <div className="process-header max-w-4xl mb-20">
          <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl text-white mb-6 tracking-wide leading-[1.05]">
            {t('home.process.title')}
          </h2>
          <p className="text-white/40 text-lg md:text-xl max-w-2xl leading-relaxed">
            {t('home.process.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.04]">
          {processes.map((process) => (
            <div
              key={process.id}
              className="process-card group relative p-10 lg:p-12 bg-black hover:bg-white/[0.025] transition-colors duration-500 overflow-hidden flex flex-col min-h-[360px]"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

              <div className="w-12 h-12 border border-white/10 flex items-center justify-center mb-8 group-hover:border-white/25 transition-colors">
                <process.icon className="w-5 h-5 text-white/35 group-hover:text-white/70 transition-colors duration-400" />
              </div>

              <h3 className="font-serif text-2xl lg:text-3xl text-white mb-4 tracking-wide leading-snug">
                {t(`home.process.features.${process.id}.title`)}
              </h3>

              <p className="text-white/40 text-base leading-relaxed group-hover:text-white/60 transition-colors duration-500 font-light">
                {t(`home.process.features.${process.id}.desc`)}
              </p>

              <div className="mt-auto pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/20">
                  {process.id.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/[0.008] blur-[180px] pointer-events-none translate-y-1/2 -translate-x-1/2" />
    </section>
  )
}
