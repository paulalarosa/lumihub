import { Link } from 'react-router-dom';
import heroFallback from '@/assets/hero-beauty.jpg';
import SEOHead from '@/components/seo/SEOHead';

const posts = [
  {
    id: 'career-management',
    title: 'Career Management: Designing a Sustainable Artistic Path',
    date: 'Jan 5, 2026',
    read: '6 min read',
    image: heroFallback,
    excerpt:
      'A practical guide to planning your career, diversifying income streams and positioning yourself for premium clients.',
  },
  {
    id: 'bridal-trends-2026',
    title: 'Bridal Makeup Trends 2026: Minimal Luxury & Timeless Glow',
    date: 'Dec 28, 2025',
    read: '7 min read',
    image: heroFallback,
    excerpt: 'Key trends shaping bridal beauty this year, from soft sculpting to metallic accents for editorial looks.',
  },
  {
    id: 'financial-independence',
    title: 'Financial Independence for Artists: Pricing, Saving & Investing',
    date: 'Nov 12, 2025',
    read: '8 min read',
    image: heroFallback,
    excerpt: 'Strategies to build reliable cashflow, set premium prices and plan for long-term financial freedom.',
  },
  {
    id: 'art-of-networking',
    title: 'The Art of Networking: From Collaborations to Brand Partnerships',
    date: 'Oct 3, 2025',
    read: '5 min read',
    image: heroFallback,
    excerpt: 'How to create meaningful professional connections and scale your creative business through partnerships.',
  },
];

export default function Blog() {
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Lumi Journal",
    "description": "Insights e dicas para profissionais de beleza sobre carreira, tendências e gestão de negócios",
    "url": "https://lumihub.lovable.app/blog",
    "publisher": {
      "@type": "Organization",
      "name": "Lumi",
      "logo": {
        "@type": "ImageObject",
        "url": "https://lumihub.lovable.app/og-image.png"
      }
    },
    "blogPost": posts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "datePublished": post.date,
      "description": post.excerpt,
      "url": `https://lumihub.lovable.app/blog/${post.id}`
    }))
  };

  return (
    <>
      <SEOHead
        title="Blog - Lumi Journal | Dicas para Profissionais de Beleza"
        description="Insights, tendências e estratégias de carreira para maquiadores e profissionais de beleza. Aprenda a crescer seu negócio."
        keywords="blog beleza, dicas maquiadores, carreira maquiagem, tendências beleza 2026"
        url="https://lumihub.lovable.app/blog"
        type="website"
        jsonLd={blogJsonLd}
      />
      <div className="min-h-screen bg-[color:var(--background, #FAFAFA)] text-[#050505]">
        <main className="container mx-auto px-6 py-20">
          <header className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="journal-title text-6xl">Lumi Journal</h1>
            <p className="mt-4 text-lg text-[#374151]">Editorial perspectives on beauty, business and craft — presented like a magazine.</p>
          </header>

        <section className="masonry">
          {posts.map((post) => (
            <article key={post.id} className="masonry-item">
              <Link to={`/blog/${post.id}`} className="group block overflow-hidden rounded-2xl">
                <div className="journal-image-wrapper">
                  <img src={post.image} alt={post.title} className="journal-image" />
                </div>
                <div className="p-4">
                  <h2 className="journal-article-title">{post.title}</h2>
                  <div className="mt-3 text-sm text-[#374151]">{post.date} • {post.read}</div>
                  <p className="mt-4 text-[#374151]">{post.excerpt}</p>
                </div>
              </Link>
            </article>
          ))}
        </section>

        <section className="max-w-3xl mx-auto mt-16 p-8 lumi-card">
          <h3 className="lumi-title text-2xl mb-4">Subscribe to the Journal</h3>
          <p className="lumi-text text-[#374151] mb-6">Receive curated editorials and the best industry insights, delivered monthly.</p>
          <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
            <input placeholder="Seu email" className="w-full bg-transparent border-0 border-b border-[hsl(var(--surface-border))] py-2 px-0 outline-none" />
            <button className="lumi-button" type="submit">Subscribe</button>
          </form>
        </section>
      </main>
    </div>
    </>
  );
}
