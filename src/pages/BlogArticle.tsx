import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useBlogPost } from '@/hooks/useBlogPosts'
import SEOHead from '@/components/seo/SEOHead'

const dateFormat = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>()
  const { data: article, isLoading } = useBlogPost(slug)

  if (isLoading) {
    return (
      <div className="bg-[#FAFAFA] min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#374151] animate-spin" />
      </div>
    )
  }

  if (!article) {
    return (
      <>
        <SEOHead
          title="Artigo não encontrado"
          description="O artigo que você procura não foi encontrado ou foi removido."
          noindex
        />
        <div className="bg-[#FAFAFA] text-[#050505] min-h-screen">
          <main className="container mx-auto px-6 py-20">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-[#374151] hover:text-[#050505]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Journal
            </Link>
            <div className="mt-12 text-center space-y-6">
              <h1 className="font-serif text-6xl italic">404</h1>
              <p className="text-[#374151] tracking-widest uppercase text-xs">
                Página não encontrada | KHAOS KONTROL
              </p>
            </div>
          </main>
        </div>
      </>
    )
  }

  const articleUrl = `https://khaoskontrol.com.br/blog/${article.slug}`
  const ogImage = article.image_url?.startsWith('http')
    ? article.image_url
    : article.image_url
      ? `https://khaoskontrol.com.br${article.image_url}`
      : '/og-image.png'

  return (
    <>
      <SEOHead
        title={article.title}
        description={article.excerpt ?? article.title}
        image={ogImage}
        url={articleUrl}
        type="article"
        author={article.author ?? 'KHAOS KONTROL Editorial'}
        publishedTime={article.published_at}
        modifiedTime={article.published_at}
        section={article.category ?? undefined}
        tags={article.category ? [article.category] : undefined}
        keywords={`${article.category ?? ''}, blog maquiadora, beauty, khaos kontrol`}
        breadcrumbs={[
          { name: 'Home', url: 'https://khaoskontrol.com.br/' },
          { name: 'Journal', url: 'https://khaoskontrol.com.br/blog' },
          { name: article.title, url: articleUrl },
        ]}
      />
    <div className="bg-[#FAFAFA] text-[#050505]">
      <main className="container mx-auto px-6 py-12">
        <div className="sticky top-20 bg-[#FAFAFA] z-40 py-4 mb-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-[#374151] hover:text-[#050505] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Journal
          </Link>
        </div>

        <article className="max-w-2xl mx-auto">
          <header className="mb-12">
            {article.image_url && (
              <div className="mb-12 aspect-[21/9] overflow-hidden rounded-[2.5rem] border border-black/5">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
              </div>
            )}
            <h1 className="journal-title text-5xl mb-6 leading-tight">
              {article.title}
            </h1>
            <div className="text-sm text-[#374151] space-y-1">
              {article.author && (
                <p className="font-semibold tracking-widest">{article.author}</p>
              )}
              <p>{dateFormat(article.published_at)}</p>
            </div>
          </header>

          <div
            className="article-body text-lg text-[#374151] leading-8 space-y-6 [&_p]:text-[#374151]"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <div className="mt-16 pt-8 border-t border-[#E5E7EB]">
            <p className="text-sm text-[#374151] mb-4">
              Ready to scale your creative business?
            </p>
            <a href="/contact" className="kk-button inline-block">
              Apply for Studio Pro
            </a>
          </div>
        </article>
      </main>
    </div>
    </>
  )
}
