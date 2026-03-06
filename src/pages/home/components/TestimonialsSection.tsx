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
        'Consegui profissionalizar completamente meu negocio. Minhas clientes adoram o portal exclusivo!',
      rating: 5,
    },
    {
      name: 'Ana Costa',
      role: 'Maquiadora & Beauty Artist',
      content:
        'O sistema de pagamentos mudou tudo! Agora recebo na hora e sem complicacao.',
      rating: 5,
    },
    {
      name: 'Juliana Mendes',
      role: 'Hair Stylist',
      content:
        'A organizacao que o KHAOS KONTROL trouxe para minha rotina e indescritivel. Recomendo!',
      rating: 5,
    },
    {
      name: 'Camila Santos',
      role: 'Nail Designer',
      content:
        'Finalmente tenho controle total das minhas financas e agenda em um so lugar.',
      rating: 5,
    },
  ]

  return (
    <section className="py-32 bg-transparent relative overflow-hidden">
      <div className="container mx-auto px-6 lg:px-8 mb-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-[10px] shadow-[0_4px_20px_0_rgba(255,255,255,0.05)] uppercase tracking-[0.3em] text-white/60 mb-8 block w-fit"
            >
              {t('testimonials_subtitle')}
            </motion.div>
            <h2 className="font-serif text-4xl md:text-6xl text-white tracking-tight">
              {t('testimonials_title')}
            </h2>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black via-[#050505]/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black via-[#050505]/80 to-transparent z-10 pointer-events-none" />

        <motion.div
          ref={marqueeRef}
          className="flex gap-8 py-8"
          animate={{ x: [0, -1350] }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: 'linear',
            repeatType: 'loop',
          }}
        >
          {[
            ...testimonials,
            ...testimonials,
            ...testimonials,
            ...testimonials,
          ].map((testimonial, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5, scale: 1.02 }}
              className="flex-shrink-0 w-[400px] border border-white/10 bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] hover:bg-white/10 shadow-[0_8px_32px_0_rgba(255,255,255,0.02)] group transition-all duration-300"
            >
              <div className="flex flex-col justify-between h-full gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-white/80 text-white/80 group-hover:fill-white group-hover:text-white transition-colors group-hover:shadow-[0_0_10px_white]"
                      />
                    ))}
                  </div>
                  <blockquote className="text-lg text-white/70 italic leading-relaxed font-serif group-hover:text-white/90 transition-colors">
                    &ldquo;{testimonial.content}&rdquo;
                  </blockquote>
                </div>
                <div className="border-t border-white/10 pt-6 group-hover:border-white/20 transition-colors">
                  <div className="text-[10px] font-bold text-white uppercase tracking-widest">
                    {testimonial.name}
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
