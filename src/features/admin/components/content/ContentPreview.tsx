import { Eye, X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface ContentPreviewProps {
  open: boolean
  onClose: () => void
  variant: 'blog' | 'help'
  title: string
  excerpt?: string | null
  category?: string | null
  imageUrl?: string | null
  author?: string | null
  content: string
  publishedAt?: string | null
}

const dateFormat = () =>
  new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

export function ContentPreview(props: ContentPreviewProps) {
  const { open, onClose, variant } = props

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-black border border-white/10 rounded-none text-white max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-white/40" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
              Preview · {variant === 'blog' ? 'Blog' : 'Central de Ajuda'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="overflow-y-auto max-h-[calc(90vh-48px)]">
          {variant === 'blog' ? <BlogPreview {...props} /> : <HelpPreview {...props} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function BlogPreview({
  title,
  excerpt,
  category,
  imageUrl,
  author,
  content,
}: ContentPreviewProps) {
  return (
    <article className="bg-[#FAFAFA] text-[#050505] min-h-full">
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <header className="mb-12">
            {imageUrl && (
              <div className="mb-12 aspect-[21/9] overflow-hidden rounded-[2.5rem] border border-black/5">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {category && (
              <span className="text-[10px] font-medium text-[#050505] border border-black/10 px-3 py-1 rounded-full inline-block mb-4">
                {category}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl leading-tight font-serif italic mb-6">
              {title || 'Título do post'}
            </h1>
            <div className="text-sm text-[#374151] space-y-1">
              {author && (
                <p className="font-semibold tracking-widest">{author}</p>
              )}
              <p>{dateFormat()}</p>
            </div>
            {excerpt && (
              <p className="mt-6 text-lg text-[#374151] leading-relaxed">
                {excerpt}
              </p>
            )}
          </header>

          <div
            className="article-body text-lg text-[#374151] leading-8 space-y-6 [&_h2]:text-[#050505] [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-[#050505] [&_h3]:font-serif [&_h3]:text-2xl [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:text-[#374151] [&_strong]:text-[#050505] [&_a]:underline [&_img]:my-6 [&_img]:max-w-full [&_img]:h-auto [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[#050505] [&_blockquote]:pl-4 [&_blockquote]:italic"
            dangerouslySetInnerHTML={{
              __html: content || '<p><em>Sem conteúdo ainda...</em></p>',
            }}
          />
        </div>
      </main>
    </article>
  )
}

function HelpPreview({
  title,
  excerpt,
  category,
  content,
}: ContentPreviewProps) {
  return (
    <article className="bg-black text-white min-h-full">
      <main className="container mx-auto px-6 py-12 max-w-3xl">
        <header className="mb-10 space-y-4 pb-8 border-b border-white/5">
          {category && (
            <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
              {category}
            </span>
          )}
          <h1 className="font-serif text-4xl md:text-5xl tracking-wide leading-tight">
            {title || 'Título do artigo'}
          </h1>
          {excerpt && (
            <p className="text-white/50 text-lg leading-relaxed">{excerpt}</p>
          )}
        </header>

        <div
          className="prose prose-invert max-w-none text-white/70 leading-relaxed [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-white [&_h2]:tracking-wide [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-white [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-4 [&_strong]:text-white [&_img]:my-6 [&_img]:max-w-full [&_img]:h-auto"
          dangerouslySetInnerHTML={{
            __html: content || '<p><em>Sem conteúdo ainda...</em></p>',
          }}
        />
      </main>
    </article>
  )
}
