import { Link } from 'react-router-dom';
import heroFallback from '@/assets/hero-beauty.jpg';
import SEOHead from '@/components/seo/SEOHead';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function Blog() {
  const { t } = useLanguage();

  const posts = [
    {
      id: 'career-management',
      title: t("post_1_title"),
      date: '05 JAN, 2026',
      read: t("post_1_read"),
      image: heroFallback,
      excerpt: t("post_1_excerpt"),
      category: t("post_1_cat")
    },
    {
      id: 'bridal-trends-2026',
      title: t("post_2_title"),
      date: '28 DEZ, 2025',
      read: t("post_2_read"),
      image: heroFallback,
      excerpt: t("post_2_excerpt"),
      category: t("post_2_cat")
    },
    {
      id: 'financial-independence',
      title: t("post_3_title"),
      date: '12 NOV, 2025',
      read: t("post_3_read"),
      image: heroFallback,
      excerpt: t("post_3_excerpt"),
      category: t("post_3_cat")
    },
    {
      id: 'art-of-networking',
      title: t("post_4_title"),
      date: '03 OUT, 2025',
      read: t("post_4_read"),
      image: heroFallback,
      excerpt: t("post_4_excerpt"),
      category: t("post_4_cat")
    },
  ];

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "KONTROL Journal",
    "description": "Perspectivas editoriais sobre o negócio da beleza.",
    "url": "https://khaoskontrol.com.br/blog",
  };

  return (
    <>
      <SEOHead
        title="JOURNAL - KONTROL | EDITORIAL"
        description="Insights e estratégias para o profissional de beleza moderno."
        keywords="blog, beleza negócios, carreira, tendências"
        url="https://khaoskontrol.com.br/blog"
        type="website"
        jsonLd={blogJsonLd}
      />
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">

        <header className="pt-32 pb-20 border-b border-white/20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center text-center">
              <span className="font-mono text-xs uppercase tracking-[0.4em] text-white/50 mb-6">
                {t("blog_badge")}
              </span>
              <h1 className="font-serif text-6xl md:text-9xl mb-8 tracking-tight">
                JOURNAL
              </h1>
              <p className="font-mono text-sm max-w-lg uppercase leading-relaxed text-white/70">
                {t("blog_subtitle")}
                <br />{t("features_page_title")} {t("features_page_subtitle")}.
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
                      <span className="font-mono text-xs uppercase tracking-widest mr-2">{t("blog_read_article")}</span>
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
            <h3 className="font-serif text-4xl mb-6">{t("blog_subscribe_title")}</h3>
            <p className="font-mono text-sm uppercase mb-10 text-black/60">
              {t("blog_subscribe_desc")}
            </p>
            <form className="flex flex-col sm:flex-row gap-0 border border-black" onSubmit={(e) => e.preventDefault()}>
              <input
                placeholder={t("blog_subscribe_placeholder")}
                className="w-full bg-transparent border-none py-4 px-6 outline-none font-mono text-sm uppercase placeholder:text-black/30"
              />
              <button
                className="bg-black text-white px-8 py-4 font-mono text-xs uppercase tracking-widest hover:bg-black/80 transition-colors whitespace-nowrap border-l border-black sm:border-l-0"
                type="submit"
              >
                {t("blog_subscribe_btn")}
              </button>
            </form>
          </div>
        </section>

      </div>
    </>
  );
}
