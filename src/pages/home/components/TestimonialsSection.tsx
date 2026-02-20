import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

export function TestimonialsSection() {
  const { t } = useLanguage()
  const marqueeRef = useRef<HTMLDivElement>(null)

  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Maquiadora Especialista em Noivas',
      content:
        'Consegui profissionalizar completamente meu negócio. Minhas clientes adoram o portal exclusivo!',
      rating: 5,
    },
    {
      name: 'Ana Costa',
      role: 'Maquiadora & Beauty Artist',
      content:
        'O sistema de pagamentos mudou tudo! Agora recebo na hora e sem complicação.',
      rating: 5,
    },
    {
      name: 'Juliana Mendes',
      role: 'Hair Stylist',
      content:
        'A organização que o KHAOS KONTROL trouxe para minha rotina é indescritível. Recomendo!',
      rating: 5,
    },
    {
      name: 'Camila Santos',
      role: 'Nail Designer',
      content:
        'Finalmente tenho controle total das minhas finanças e agenda em um só lugar.',
      rating: 5,
    },
  ]

  return (
    <section className="py-32 bg-black relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center space-y-4">
          <h2 className="font-serif font-light text-4xl lg:text-5xl text-white tracking-tight">
            {t('testimonials_title')}
          </h2>
          <p className="text-sm font-mono text-white/40 max-w-2xl mx-auto uppercase tracking-widest">
            {t('testimonials_subtitle')}
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />

        <motion.div
          ref={marqueeRef}
          className="flex gap-6"
          animate={{ x: [0, -1200] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
            repeatType: 'loop',
          }}
        >
          {[...testimonials, ...testimonials, ...testimonials].map(
            (testimonial, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-[400px] border border-white/20 bg-black rounded-none p-8 hover:bg-white hover:text-black group transition-all duration-300"
              >
                <div className="space-y-6">
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-white text-white group-hover:fill-black group-hover:text-black"
                      />
                    ))}
                  </div>
                  <blockquote className="text-lg text-white/70 italic leading-relaxed font-light group-hover:text-black/70">
                    "{testimonial.content}"
                  </blockquote>
                  <div>
                    <div className="font-serif font-light text-white group-hover:text-black uppercase">
                      {testimonial.name}
                    </div>
                    <div className="text-xs font-mono text-white/40 group-hover:text-black/40 uppercase tracking-widest">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ),
          )}
        </motion.div>
      </div>
    </section>
  )
}
