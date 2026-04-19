import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search, Loader2, BookOpen } from 'lucide-react'
import SEOHead from '@/components/seo/SEOHead'
import { Input } from '@/components/ui/input'
import { useHelpArticles, type HelpArticle } from '@/hooks/useKnowledgeBase'

export default function HelpPage() {
  const [search, setSearch] = useState('')
  const { data: articles = [], isLoading } = useHelpArticles(search)

  const grouped = useMemo(() => {
    const map = new Map<string, HelpArticle[]>()
    for (const article of articles) {
      const key = article.category || 'Geral'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(article)
    }
    return Array.from(map.entries()).map(([category, items]) => ({
      category,
      items,
    }))
  }, [articles])

  return (
    <>
      <SEOHead
        title="Central de Ajuda"
        description="Tire suas dúvidas sobre o Khaos Kontrol — guias, tutoriais e respostas para profissionais de beleza."
        url="https://khaoskontrol.com.br/ajuda"
        keywords="ajuda khaos kontrol, tutorial maquiadora, central de ajuda beauty, suporte crm"
      />

      <div className="min-h-screen bg-black text-white">
        <main className="container mx-auto px-6 lg:px-10 pt-28 pb-24 max-w-5xl">
          <header className="mb-14 space-y-4 border-b border-white/5 pb-10">
            <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
              Central de ajuda
            </span>
            <h1 className="font-serif text-4xl md:text-6xl tracking-wide leading-tight">
              Como podemos ajudar?
            </h1>
            <p className="text-white/40 text-lg max-w-2xl leading-relaxed">
              Guias rápidos e respostas diretas para você aproveitar ao máximo o
              Khaos Kontrol.
            </p>

            <div className="relative max-w-xl pt-4">
              <Search className="absolute left-3 top-1/2 translate-y-1 w-4 h-4 text-white/30" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busque por palavra-chave..."
                className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 rounded-none h-11"
              />
            </div>
          </header>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <div className="border border-white/5 py-20 text-center space-y-3">
              <BookOpen className="w-6 h-6 text-white/20 mx-auto" />
              <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
                Nenhum artigo encontrado
              </p>
              <p className="text-white/30 text-sm">
                Tente outra palavra-chave ou entre em contato com o suporte.
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {grouped.map(({ category, items }) => (
                <section key={category} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <h2 className="font-mono text-[10px] text-white/50 tracking-[0.3em] uppercase">
                      {category}
                    </h2>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
                    {items.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          <footer className="mt-20 pt-10 border-t border-white/5 text-center space-y-4">
            <p className="text-white/40 text-sm">
              Não encontrou o que procurava?
            </p>
            <Link
              to="/contato"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white border border-white/20 px-6 py-3 hover:bg-white/5 transition-colors"
            >
              Falar com suporte
              <ArrowRight className="w-3 h-3" />
            </Link>
          </footer>
        </main>
      </div>
    </>
  )
}

function ArticleCard({ article }: { article: HelpArticle }) {
  return (
    <Link
      to={`/ajuda/${article.slug}`}
      className="group block bg-black p-8 hover:bg-white/[0.02] transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <h3 className="font-serif text-xl text-white tracking-wide leading-snug group-hover:text-white/80 transition-colors">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-white/40 text-sm leading-relaxed line-clamp-2">
              {article.excerpt}
            </p>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
      </div>
    </Link>
  )
}
