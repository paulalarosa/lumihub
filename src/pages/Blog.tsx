import { Link } from 'react-router-dom';
import heroFallback from '@/assets/hero-beauty.jpg';
import SEOHead from '@/components/seo/SEOHead';
import { ArrowRight } from 'lucide-react';

const posts = [
  {
    id: 'career-management',
    title: 'Gestão de Carreira: Desenhando um Caminho Artístico Sustentável',
    date: '05 JAN, 2026',
    read: '6 MIN LEITURA',
    image: heroFallback,
    excerpt: 'Um guia prático para planejar sua carreira, diversificar fontes de renda e se posicionar para clientes premium.',
    category: 'NEGÓCIOS'
  },
  {
    id: 'bridal-trends-2026',
    title: 'Tendências Noivas 2026: Luxo Minimalista & Glow Atemporal',
    date: '28 DEZ, 2025',
    read: '7 MIN LEITURA',
    image: heroFallback,
    excerpt: 'Principais tendências moldando a beleza das noivas este ano, do sculpting suave a acentos metálicos para looks editoriais.',
    category: 'TENDÊNCIAS'
  },
  {
    id: 'financial-independence',
    title: 'Independência Financeira: Precificação, Poupança & Investimento',
    date: '12 NOV, 2025',
    read: '8 MIN LEITURA',
    image: heroFallback,
    excerpt: 'Estratégias para construir fluxo de caixa confiável, definir preços premium e planejar liberdade financeira de longo prazo.',
    category: 'FINANÇAS'
  },
  {
    id: 'art-of-networking',
    title: 'A Arte do Networking: De Colaborações a Parcerias de Marca',
    date: '03 OUT, 2025',
    read: '5 MIN LEITURA',
    image: heroFallback,
    excerpt: 'Como criar conexões profissionais significativas e escalar seu negócio criativo através de parcerias estratégicas.',
    category: 'CRESCIMENTO'
  },
];

export default function Blog() {
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Lumi Journal",
    "description": "Perspectivas editoriais sobre o negócio da beleza.",
    "url": "https://lumihub.lovable.app/blog",
  };

  return (
    <>
      <SEOHead
        title="JOURNAL - LUMI | EDITORIAL"
        description="Insights e estratégias para o profissional de beleza moderno."
        keywords="blog, beleza negócios, carreira, tendências"
        url="https://lumihub.lovable.app/blog"
        type="website"
        jsonLd={blogJsonLd}
      />
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">

        <header className="pt-32 pb-20 border-b border-white/20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center text-center">
              <span className="font-mono text-xs uppercase tracking-[0.4em] text-white/50 mb-6">
                Departamento Editorial Lumi
              </span>
              <h1 className="font-serif text-6xl md:text-9xl mb-8 tracking-tight">
                JOURNAL
              </h1>
              <p className="font-mono text-sm max-w-lg uppercase leading-relaxed text-white/70">
                Perspectivas sobre beleza, negócios e arte.
                <br />Projetado para o artista ambicioso.
              </p>
            </div>
          </div>
        </header>

        <section className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
            {posts.map((post) => (
              <article key={post.id} className="group cursor-pointer">
                <Link to={`/blog/${post.id}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden mb-8 border border-white/10 group-hover:border-white/50 transition-colors">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-out transform group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-black border border-white px-3 py-1">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex divide-x divide-white/20 font-mono text-xs text-white/40 uppercase tracking-widest">
                      <span className="pr-3">{post.date}</span>
                      <span className="pl-3">{post.read}</span>
                    </div>

                    <h2 className="font-serif text-3xl group-hover:underline decoration-1 underline-offset-4 leading-tight">
                      {post.title}
                    </h2>

                    <p className="font-mono text-xs text-white/60 leading-relaxed uppercase max-w-md">
                      {post.excerpt}
                    </p>

                    <div className="pt-4 flex items-center text-white/50 group-hover:text-white transition-colors">
                      <span className="font-mono text-xs uppercase tracking-widest mr-2">LER ARTIGO</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-white/20 py-24 bg-white text-black">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h3 className="font-serif text-4xl mb-6">ASSINE O EDITORIAL</h3>
            <p className="font-mono text-sm uppercase mb-10 text-black/60">
              Receba notificações quando publicarmos novos editoriais.
            </p>
            <form className="flex flex-col sm:flex-row gap-0 border border-black" onSubmit={(e) => e.preventDefault()}>
              <input
                placeholder="ENDEREÇO DE EMAIL"
                className="w-full bg-transparent border-none py-4 px-6 outline-none font-mono text-sm uppercase placeholder:text-black/30"
              />
              <button
                className="bg-black text-white px-8 py-4 font-mono text-xs uppercase tracking-widest hover:bg-black/80 transition-colors whitespace-nowrap border-l border-black sm:border-l-0"
                type="submit"
              >
                INSCREVER
              </button>
            </form>
          </div>
        </section>

      </div>
    </>
  );
}
