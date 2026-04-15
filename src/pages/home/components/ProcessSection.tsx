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

    // Section Title and Subtitle Reveal
    gsap.fromTo('.process-header', 
      { y: 30, opacity: 0 },
      { 
        y: 0, 
        opacity: 1,
        duration: 1.5,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.process-header',
          start: 'top 90%',
        }
      }
    )

    // Sequential cards reveal on scroll
    const cards = gsap.utils.toArray<HTMLElement>('.process-card')
    cards.forEach((card, i) => {
      gsap.fromTo(card, 
        { 
          y: 60, 
          opacity: 0,
          scale: 0.95
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
            // Slightly delay each one for a staggered feel even on scroll
            onEnter: () => {
              gsap.to(card, { delay: i % 3 * 0.1, duration: 0 }) 
            }
          }
        }
      )
    })

    // Refresh ScrollTrigger to ensure correct positions after layout
    ScrollTrigger.refresh()
  }, { scope: sectionRef })

  const processes = [
    {
      icon: MessageCircle,
      id: 'management',
    },
    {
      icon: FileCheck2,
      id: 'legal',
    },
    {
      icon: PieChart,
      id: 'financial',
    },
    {
      icon: Sparkles,
      id: 'experience',
    },
    {
      icon: Clock,
      id: 'automation',
    },
    {
      icon: TrendingUp,
      id: 'growth',
    },
  ]

  return (
    <section
      id="como-funciona"
      ref={sectionRef}
      className="relative py-40 bg-black overflow-hidden"
    >
      <div 
        ref={containerRef}
        className="container mx-auto px-6 lg:px-16 relative z-10"
      >
        <div className="process-header max-w-4xl mb-32">
          <h2 className="font-serif text-5xl md:text-7xl text-white mb-8 tracking-tight leading-[1.1]">
            {t('home.process.title')}
          </h2>
          <p className="text-white/40 text-xl md:text-2xl max-w-2xl leading-relaxed">
            {t('home.process.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-1 tracking-tighter">
          {processes.map((process) => (
            <div
              key={process.id}
              className="process-card group relative p-12 lg:p-16 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-700 overflow-hidden flex flex-col min-h-[400px]"
            >
              {}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center mb-10 group-hover:border-white/30 transition-colors bg-white/[0.02]">
                <process.icon className="w-6 h-6 text-white/40 group-hover:text-white transition-all duration-500" />
              </div>
              
              <h3 className="font-serif text-3xl text-white mb-6 tracking-tight">
                {t(`home.process.features.${process.id}.title`)}
              </h3>
              
              <p className="text-white/40 text-lg leading-relaxed group-hover:text-white/70 transition-colors duration-500 font-light">
                {t(`home.process.features.${process.id}.desc`)}
              </p>

              {}
              <div className="mt-auto pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/20">
                  SYSTEM_CORE // {process.id.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#00e5ff]/[0.015] blur-[200px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/[0.01] blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
    </section>
  )
}
