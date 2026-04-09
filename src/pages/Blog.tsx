import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import SEOHead from '@/components/seo/SEOHead'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useLanguage } from '@/hooks/useLanguage'

const blogPosts = [
  {
    slug: 'vencer-na-carreira-maker',
    title: 'A Ciência do Sucesso na Carreira de Makeup Artist',
    excerpt:
      'Como estruturar sua carreira do zero ao reconhecimento internacional no mercado de beleza de luxo.',
    category: 'CARREIRA',
    date: '15 Mar 2025',
    readTime: '8 min',
    featured: true,
    image: '/blog/career-success.png',
  },
  {
    slug: 'tendencias-noivas-2025',
    title: 'Tendências de Maquiagem Nupcial para 2025',
    excerpt:
      'Descubra as texturas, cores e acabamentos que vão dominar as cerimônias mais exclusivas da temporada.',
    category: 'ESTILO',
    date: '10 Mar 2025',
    readTime: '6 min',
    featured: false,
    image: '/blog/bridal-2025.png',
  },
  {
    slug: 'contratos-digitais-luxo',
    title: 'A Importância de Contratos Digitais no Mercado de Luxo',
    excerpt:
      'Segurança jurídica e experiência do cliente: por que a automação é o novo padrão ouro.',
    category: 'NEGÓCIOS',
    date: '05 Mar 2025',
    readTime: '10 min',
    featured: false,
    image:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2000&auto=format&fit=crop',
  },
  {
    slug: 'marketing-digital-makeup',
    title: 'Domine o Algoritmo: Marketing para Maquiadoras',
    excerpt:
      'Estratégias avançadas de posicionamento para atrair clientes de alto ticket no Instagram e TikTok.',
    category: 'MARKETING',
    date: '01 Mar 2025',
    readTime: '12 min',
    featured: false,
    image:
      'https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?q=80&w=2000&auto=format&fit=crop',
  },
]

export default function BlogPage() {
  const { t } = useLanguage()
  const featuredPost = blogPosts.find((p) => p.featured)
  const otherPosts = blogPosts.filter((p) => !p.featured)

  return (
    <>
      <SEOHead
        title={t('landing.blog.seo_title')}
        description={t('landing.blog.seo_description')}
        keywords="blog maquiadora profissional, dicas gestão beauty, tendências maquiagem noiva, negócio maquiagem"
        url="https://khaoskontrol.com.br/blog"
        type="website"
      />
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        {}
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
          <img
            src="/khaos-uploads/734febb0-c2fc-4623-98e2-bbe5a386408f.png"
            alt="Background Texture"
            className="w-full h-full object-cover grayscale brightness-50"
          />
        </div>
        {}
        <div className="fixed top-[-20%] right-[-10%] w-[40%] h-[40%] bg-foreground/[0.015] blur-[180px] rounded-full pointer-events-none" />

        <main className="container mx-auto px-6 lg:px-10 pt-40 pb-24 relative z-10 text-left">
          {}
          <div className="max-w-4xl mb-20 space-y-6 text-left">
            <SectionHeader
              eyebrow={t('landing.blog.eyebrow')}
              title={t('landing.blog.title')}
              subtitle={t('landing.blog.subtitle')}
              centered={false}
            />
          </div>

          {}
          {featuredPost && (
            <motion.article
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-16 group text-left"
            >
              <Link to={`/blog/${featuredPost.slug}`} className="block">
                <div className="rounded-[2.5rem] border border-border bg-card/40 hover:bg-accent/10 hover:border-border/60 transition-all duration-500 overflow-hidden">
                  <div className="aspect-[21/9] bg-accent/10 relative overflow-hidden">
                    <img
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale hover:grayscale-0 opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="font-serif text-[8rem] md:text-[12rem] text-foreground/10 italic select-none mix-blend-overlay">
                        {t('landing.blog.featured')}
                      </span>
                    </div>
                  </div>
                  <div className="p-10 md:p-14 space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-medium text-foreground border border-border px-3 py-1 rounded-full">
                        {featuredPost.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {featuredPost.date} · {featuredPost.readTime}
                      </span>
                    </div>
                    <h2 className="font-serif text-3xl md:text-5xl text-foreground italic group-hover:text-muted-foreground transition-colors leading-tight text-left">
                      {featuredPost.title}
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed text-left">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-2 text-foreground group-hover:gap-4 transition-all">
                      <span className="text-xs font-medium">{t('landing.blog.read_more')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.article>
          )}

          {}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {otherPosts.map((post, index) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.6 }}
                className="group text-left"
              >
                <Link to={`/blog/${post.slug}`} className="block h-full">
                  <div className="rounded-[2.5rem] border border-border bg-card/40 hover:bg-accent/10 hover:border-border/60 transition-all duration-500 overflow-hidden h-full flex flex-col">
                    {}
                    <div className="aspect-[4/3] bg-accent/10 relative overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale group-hover:grayscale-0 opacity-80"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="font-serif text-6xl text-foreground/10 italic select-none mix-blend-overlay">
                          {String(index + 2).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-background/20 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />
                    </div>

                    <div className="p-7 space-y-4 flex-1 flex flex-col">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-medium text-foreground border border-border px-2.5 py-1 rounded-full">
                          {post.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {post.readTime}
                        </span>
                      </div>

                      <h3 className="font-serif text-xl text-foreground italic group-hover:text-muted-foreground transition-colors leading-snug flex-1 text-left">
                        {post.title}
                      </h3>

                      <p className="text-xs text-muted-foreground leading-relaxed text-left">
                        {post.excerpt}
                      </p>

                      <div className="pt-4 border-t border-border flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {post.date}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </main>
      </div>
    </>
  )
}

