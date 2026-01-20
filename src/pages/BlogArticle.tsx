import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const articleData: Record<string, any> = {
  'career-management': {
    title: 'Career Management: Designing a Sustainable Artistic Path',
    author: 'KONTROL Editorial',
    date: 'January 5, 2026',
    content: `
      <p>In an industry where creativity meets commerce, the most successful beauty professionals are those who think beyond the immediate project. Career management for makeup artists, maquiadores, and beauty entrepreneurs is not just about executing beautiful work—it's about building a sustainable, scalable business that aligns with your values and financial goals.</p>
      
      <p>The first step in designing your artistic path is understanding where you are now. Take inventory of your current income streams. Are you relying on a single type of project? Do you have steady recurring clients, or is your schedule feast-or-famine? Many artists find themselves trapped in a cycle where they're constantly chasing the next gig, leaving no time for strategic thinking. This is precisely when burnout creeps in, and creativity suffers.</p>
      
      <p>Diversification is the cornerstone of sustainable careers. Consider how you can expand your offerings without diluting your core expertise. A bridal makeup artist might add makeup lessons, editorial consulting, or product curation to their portfolio. These offerings not only generate additional revenue but also position you as a thought leader in your space. Clients respect professionals who are actively developing their craft and sharing knowledge.</p>
      
      <p>Finally, remember that career design is not static. The beauty industry evolves rapidly—trends shift, platforms change, and client expectations are constantly redefined. The artists who thrive are those who invest in continuous learning, maintain meaningful professional relationships, and aren't afraid to pivot when necessary. Your career is the canvas; you're the artist.</p>
    `,
  },
  'bridal-trends-2026': {
    title: 'Bridal Makeup Trends 2026: Minimal Luxury & Timeless Glow',
    author: 'Lumi Editorial',
    date: 'December 28, 2025',
    content: `
      <p>As we enter 2026, bridal beauty is undergoing a profound shift toward minimalism married with luxury. Gone are the days of heavy contouring and overdone features. Today's bride seeks authenticity—a polished version of herself that photographs beautifully but still feels natural when she looks in the mirror on her wedding day.</p>
      
      <p>The "skin-first" approach dominates. This means investing in skincare weeks before the wedding, focusing on hydration, luminosity, and even complexion. The makeup itself becomes a second layer, enhancing rather than transforming. Think dewy skin, barely-there foundation, and strategic highlighting that catches light naturally. The goal is a bridal glow that comes from within, not from heavy shimmer applied on top.</p>
      
      <p>Trend-wise, soft sculpting has replaced aggressive contouring. Instead of harsh lines, makeup artists are using cool-toned, finely blended shadows to create subtle dimension. Eyes lean toward neutral, earthy tones with softer transitions—think warm bronzes, dusty roses, and champagne metallics. The focus is on opening and defining the eye without creating drama. Lips vary by bride preference, but nude-to-pink shades that complement skin undertones are reigning supreme.</p>
      
      <p>For editorial and high-fashion bridal work, metallic accents are making a quiet comeback—but executed with restraint. A brushed gold on the inner lid, a touch of silver on the browbone, or a subtle bronze along the lash line adds modern edge without overwhelming the face. The key word is "editorial," not "editorial overkill." Brides want to look magazine-worthy, but they still want to look like themselves.</p>
    `,
  },
  'financial-independence': {
    title: 'Financial Independence for Artists: Pricing, Saving & Investing',
    author: 'Lumi Editorial',
    date: 'November 12, 2025',
    content: `
      <p>Financial independence is the ultimate luxury for creative professionals. It's the freedom to choose your clients, decline projects that don't align with your vision, and invest in tools and experiences that genuinely serve your craft. Yet many artists struggle with pricing, saving, and long-term financial planning, often because these skills were never taught in art school.</p>
      
      <p>Pricing is where many creatives leave money on the table. Your rate should reflect not just the time spent on the client, but your expertise, equipment costs, ongoing education, insurance, and the value you deliver. A makeup artist's price isn't just for the hours of application—it's for years of training, the pressure of getting every detail perfect, your artistic vision, and the confidence you give your client. Don't apologize for premium pricing. Instead, communicate the value clearly.</p>
      
      <p>Once you've established fair pricing, the next step is building a savings buffer. Many beauty professionals work on project-based income, which means cash flow can be unpredictable. Aim to save 3-6 months of operating expenses before investing in growth. This buffer allows you to say "no" to underpriced projects and invest strategically in your business during slower seasons.</p>
      
      <p>Finally, consider how your money works for you. While savings are essential, so is strategic investing. Whether it's investing in premium tools, professional development, your website, or diversified financial instruments, think long-term. Financial independence isn't built overnight, but with intentional decisions today, you can create the freedom and security that allows your art to flourish tomorrow.</p>
    `,
  },
  'art-of-networking': {
    title: 'The Art of Networking: From Collaborations to Brand Partnerships',
    author: 'Lumi Editorial',
    date: 'October 3, 2025',
    content: `
      <p>Networking is often misunderstood as transactional—exchanging business cards and collecting LinkedIn connections. But for creative professionals, networking is something far more meaningful: it's the art of building genuine relationships that lead to collaborations, mentorship, and mutual growth. When done authentically, networking becomes a cornerstone of a thriving creative career.</p>
      
      <p>The most powerful networks are built on shared values and genuine interest in others' work. Instead of asking "What can this person do for me?", start with "What can I learn from this person?" or "How can I support their work?" This mindset shift transforms networking from a transactional chore into something energizing. You're not collecting contacts; you're building a community of like-minded creatives.</p>
      
      <p>Collaborations are where magic happens. Partnering with photographers, fashion designers, stylists, and other makeup artists expands your portfolio, exposes you to new audiences, and sparks creative innovation. The best collaborations happen when each party brings equal expertise and enthusiasm. Look for collaborators whose aesthetic complements yours and whose work you genuinely admire.</p>
      
      <p>Brand partnerships represent the next level of professional growth. Brands want to work with artists who have a distinct voice and engaged audience. Start by building your own brand—through consistent, high-quality work and meaningful content. Engage authentically with brands you love. Then, when partnership opportunities arise, you'll be positioned to negotiate from a place of strength. Remember: your artistic integrity is your most valuable asset. Only partner with brands that align with your values and vision.</p>
    `,
  },
};

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = articleData[slug || ''];

  if (!article) {
    return (
      <div className=" bg-[#FAFAFA] text-[#050505]">
        <main className="container mx-auto px-6 py-20">
          <Link to="/blog" className="inline-flex items-center gap-2 text-[#374151] hover:text-[#050505]">
            <ArrowLeft className="h-4 w-4" />
            Back to Journal
          </Link>
          <div className="mt-12 text-center">
            <p className="text-lg text-[#374151]">Artigo não encontrado.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAFA] text-[#050505]">

      <main className="container mx-auto px-6 py-12">
        {/* Sticky Back Link */}
        <div className="sticky top-20 bg-[#FAFAFA] z-40 py-4 mb-8">
          <Link to="/blog" className="inline-flex items-center gap-2 text-[#374151] hover:text-[#050505] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Journal
          </Link>
        </div>

        {/* Article Content */}
        <article className="max-w-2xl mx-auto">
          {/* Header */}
          <header className="mb-12">
            <h1 className="journal-title text-5xl mb-6 leading-tight">{article.title}</h1>
            <div className="text-sm text-[#374151] space-y-1">
              <p className="font-semibold tracking-widest">{article.author}</p>
              <p>{article.date}</p>
            </div>
          </header>

          {/* Body */}
          <div className="article-body text-lg text-[#374151] leading-8 space-y-6">
            {article.content.split('\n').filter((p: string) => p.trim().startsWith('<p>')).map((paragraph: string, idx: number) => (
              <p key={idx} className="text-[#374151]">
                {paragraph.replace(/<p>|<\/p>/g, '')}
              </p>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="mt-16 pt-8 border-t border-[#E5E7EB]">
            <p className="text-sm text-[#374151] mb-4">Ready to scale your creative business?</p>
            <a href="/contact" className="lumi-button inline-block">
              Apply for Studio Pro
            </a>
          </div>
        </article>
      </main>
    </div>
  );
}
