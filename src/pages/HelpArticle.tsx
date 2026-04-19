import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import SEOHead from '@/components/seo/SEOHead'
import { useHelpArticle } from '@/hooks/useKnowledgeBase'

const dateFormat = (iso: string | null) => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function HelpArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: article, isLoading } = useHelpArticle(slug)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    )
  }

  if (!article) {
    return (
      <>
        <SEOHead
          title="Artigo não encontrado"
          description="O artigo solicitado não existe ou foi removido."
          noindex
        />
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6 border border-white/10 p-10">
            <p className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
              404
            </p>
            <p className="font-serif text-2xl">Artigo não encontrado</p>
            <Link
              to="/ajuda"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white border border-white/20 px-6 py-3 hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Voltar à central de ajuda
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEOHead
        title={article.title}
        description={article.excerpt ?? article.title}
        url={`https://khaoskontrol.com.br/ajuda/${article.slug}`}
        type="article"
        section={article.category}
        tags={article.tags ?? undefined}
        modifiedTime={article.updated_at ?? undefined}
        breadcrumbs={[
          { name: 'Home', url: 'https://khaoskontrol.com.br/' },
          { name: 'Ajuda', url: 'https://khaoskontrol.com.br/ajuda' },
          {
            name: article.title,
            url: `https://khaoskontrol.com.br/ajuda/${article.slug}`,
          },
        ]}
      />

      <div className="min-h-screen bg-black text-white">
        <main className="container mx-auto px-6 lg:px-10 pt-28 pb-24 max-w-3xl">
          <Link
            to="/ajuda"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/50 hover:text-white transition-colors mb-10"
          >
            <ArrowLeft className="w-3 h-3" />
            Central de ajuda
          </Link>

          <header className="mb-10 space-y-4 pb-8 border-b border-white/5">
            <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
              {article.category}
            </span>
            <h1 className="font-serif text-4xl md:text-5xl tracking-wide leading-tight">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-white/50 text-lg leading-relaxed">
                {article.excerpt}
              </p>
            )}
            {article.updated_at && (
              <p className="font-mono text-[9px] text-white/30 tracking-widest uppercase pt-2">
                Atualizado em {dateFormat(article.updated_at)}
              </p>
            )}
          </header>

          <article
            className="prose prose-invert max-w-none text-white/70 leading-relaxed [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-white [&_h2]:tracking-wide [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-white [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-4 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-white/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_strong]:text-white"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <footer className="mt-16 pt-8 border-t border-white/5 space-y-4 text-center">
            <p className="text-white/40 text-sm">Esse artigo foi útil?</p>
            <Link
              to="/contato"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white border border-white/20 px-6 py-3 hover:bg-white/5 transition-colors"
            >
              Falar com suporte
            </Link>
          </footer>
        </main>
      </div>
    </>
  )
}
