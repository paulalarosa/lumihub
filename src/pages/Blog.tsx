import { Link } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import SEOHead from '@/components/seo/SEOHead'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useLanguage } from '@/hooks/useLanguage'
import { useBlogPosts, type BlogPost } from '@/hooks/useBlogPosts'

const dateFormat = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

export default function BlogPage() {
  const { t } = useLanguage()
  const { data: posts = [], isLoading } = useBlogPosts()

  const featuredPost = posts.find((p) => p.is_featured)
  const otherPosts = posts.filter((p) => p.id !== featuredPost?.id)

  return (
    <>
      <SEOHead
        title={t('blog.seo_title')}
        description={t('blog.subtitle')}
        keywords="blog maquiadora profissional, dicas gestão beauty, tendências maquiagem noiva, negócio maquiagem"
        url="https://khaoskontrol.com.br/blog"
        type="website"
      />
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
          <img
            src="/khaos-uploads/734febb0-c2fc-4623-98e2-bbe5a386408f.png"
            alt=""
            className="w-full h-full object-cover grayscale brightness-50"
          />
        </div>
        <div className="fixed top-[-20%] right-[-10%] w-[40%] h-[40%] bg-white/[0.015] blur-[180px] rounded-full pointer-events-none" />

        <main className="container mx-auto px-6 lg:px-10 pt-28 sm:pt-36 md:pt-40 pb-24 relative z-10 text-left">
          <div className="max-w-4xl mb-20 space-y-6 text-left">
            <SectionHeader
              eyebrow={t('blog.editorial')}
              title="JOURNAL"
              subtitle={t('blog.subtitle')}
              centered={false}
            />
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="border border-white/5 py-20 text-center">
              <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
                Nenhum artigo publicado ainda
              </p>
            </div>
          ) : (
            <>
              {featuredPost && <FeaturedCard post={featuredPost} label={t('blog.featured')} readMore={t('blog.read_more')} />}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {otherPosts.map((post, index) => (
                  <ArticleCard key={post.id} post={post} index={index} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  )
}

function FeaturedCard({
  post,
  label,
  readMore,
}: {
  post: BlogPost
  label: string
  readMore: string
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="mb-16 group text-left"
    >
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 overflow-hidden">
          <div className="aspect-[16/9] sm:aspect-[21/9] bg-white/[0.03] relative overflow-hidden">
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale hover:grayscale-0 opacity-80"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-serif text-[8rem] md:text-[12rem] text-white/10 italic select-none mix-blend-overlay">
                {label}
              </span>
            </div>
          </div>
          <div className="p-10 md:p-14 space-y-6">
            <div className="flex items-center gap-4">
              {post.category && (
                <span className="text-[10px] font-medium text-white border border-white/10 px-3 py-1 rounded-full">
                  {post.category}
                </span>
              )}
              <span className="text-xs text-muted-foreground/50">
                {dateFormat(post.published_at)}
                {post.read_time && ` · ${post.read_time}`}
              </span>
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-white italic group-hover:text-muted-foreground transition-colors leading-tight text-left">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed text-left">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-2 text-white group-hover:gap-4 transition-all">
              <span className="text-xs font-medium">{readMore}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

function ArticleCard({ post, index }: { post: BlogPost; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.6 }}
      className="group text-left"
    >
      <Link to={`/blog/${post.slug}`} className="block h-full">
        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 overflow-hidden h-full flex flex-col">
          <div className="aspect-[4/3] bg-white/[0.03] relative overflow-hidden">
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale group-hover:grayscale-0 opacity-80"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-serif text-6xl text-white/10 italic select-none mix-blend-overlay">
                {String(index + 2).padStart(2, '0')}
              </span>
            </div>
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />
          </div>

          <div className="p-7 space-y-4 flex-1 flex flex-col">
            <div className="flex items-center gap-3">
              {post.category && (
                <span className="text-[10px] font-medium text-white border border-white/10 px-2.5 py-1 rounded-full">
                  {post.category}
                </span>
              )}
              {post.read_time && (
                <span className="text-[10px] text-muted-foreground/40">
                  {post.read_time}
                </span>
              )}
            </div>

            <h3 className="font-serif text-xl text-white italic group-hover:text-muted-foreground transition-colors leading-snug flex-1 text-left">
              {post.title}
            </h3>

            {post.excerpt && (
              <p className="text-xs text-muted-foreground leading-relaxed text-left">
                {post.excerpt}
              </p>
            )}

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/40">
                {dateFormat(post.published_at)}
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
