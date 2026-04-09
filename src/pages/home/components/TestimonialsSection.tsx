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
      role: t('landing.testimonials.role1'),
      content: t('landing.testimonials.content1'),
      rating: 5,
    },
    {
      name: 'Ana Costa',
      role: t('landing.testimonials.role2'),
      content: t('landing.testimonials.content2'),
      rating: 5,
    },
    {
      name: 'Juliana Mendes',
      role: t('landing.testimonials.role3'),
      content: t('landing.testimonials.content3'),
      rating: 5,
    },
    {
      name: 'Camila Santos',
      role: t('landing.testimonials.role4'),
      content: t('landing.testimonials.content4'),
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
              className="inline-block px-4 py-2 rounded-full border border-border bg-foreground/5 backdrop-blur-xl text-[10px] shadow-[0_4px_20px_0_rgba(255,255,255,0.05)] uppercase tracking-[0.3em] text-muted-foreground mb-8 block w-fit"
            >
              {t('testimonials_subtitle')}
            </motion.div>
            <h2 className="font-serif text-4xl md:text-6xl text-foreground tracking-tight">
              {t('testimonials_title')}
            </h2>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />

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
              className="flex-shrink-0 w-[400px] border border-border bg-foreground/5 backdrop-blur-3xl p-10 rounded-[2.5rem] hover:bg-foreground/10 shadow-[0_8px_32px_0_rgba(255,255,255,0.02)] group transition-all duration-300"
            >
              <div className="flex flex-col justify-between h-full gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-foreground/80 text-foreground/80 group-hover:fill-foreground group-hover:text-foreground transition-colors"
                      />
                    ))}
                  </div>
                  <blockquote className="text-lg text-foreground/70 italic leading-relaxed font-serif group-hover:text-foreground/90 transition-colors">
                    &ldquo;{testimonial.content}&rdquo;
                  </blockquote>
                </div>
                <div className="border-t border-border pt-6 group-hover:border-foreground/20 transition-colors">
                  <div className="text-[10px] font-bold text-foreground uppercase tracking-widest">
                    {testimonial.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
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
