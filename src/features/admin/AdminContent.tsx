import { useState } from 'react'
import {
  Plus,
  FileText,
  BookOpen,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Star,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from './components/content/RichTextEditor'
import { ImageUrlInput } from './components/content/ImageUrlInput'
import { ContentPreview } from './components/content/ContentPreview'
import { Eye } from 'lucide-react'
import {
  useAdminBlogPosts,
  useAdminHelpArticles,
  useSaveBlogPost,
  useSaveHelpArticle,
  useDeleteContent,
  type BlogPostRow,
  type HelpArticleRow,
} from './hooks/useAdminContent'

type Tab = 'blog' | 'help'

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

export default function AdminContent() {
  const [tab, setTab] = useState<Tab>('blog')

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
            Conteúdo
          </span>
          <h1 className="font-serif text-3xl text-white mt-1">
            Blog & Central de Ajuda
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Crie e edite artigos publicados em khaoskontrol.com.br/blog e /ajuda
          </p>
        </div>
      </header>

      <nav className="flex items-center gap-0 border-b border-white/10">
        <TabButton active={tab === 'blog'} onClick={() => setTab('blog')} icon={FileText}>
          Blog
        </TabButton>
        <TabButton active={tab === 'help'} onClick={() => setTab('help')} icon={BookOpen}>
          Central de Ajuda
        </TabButton>
      </nav>

      {tab === 'blog' ? <BlogManager /> : <HelpManager />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: typeof FileText
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 border-b-2 -mb-px transition-colors font-mono text-xs uppercase tracking-widest ${
        active
          ? 'border-white text-white'
          : 'border-transparent text-white/40 hover:text-white/70'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {children}
    </button>
  )
}

function BlogManager() {
  const { data: posts = [], isLoading } = useAdminBlogPosts()
  const save = useSaveBlogPost()
  const del = useDeleteContent('blog')
  const [editing, setEditing] = useState<BlogPostRow | 'new' | null>(null)

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <p className="font-mono text-[10px] text-white/40 tracking-widest uppercase">
          {isLoading ? 'Carregando…' : `${posts.length} posts`}
        </p>
        <Button variant="primary" onClick={() => setEditing('new')}>
          <Plus className="w-4 h-4 mr-2" /> Novo post
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="border border-white/5 py-16 text-center text-white/40 text-sm">
          Nenhum post ainda. Clique em "Novo post" para criar.
        </div>
      ) : (
        <div className="border border-white/10 bg-white/[0.02] divide-y divide-white/5">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {post.is_featured && <Star className="w-3 h-3 text-yellow-400" />}
                  {post.is_published ? (
                    <Eye className="w-3 h-3 text-green-500/70" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-white/30" />
                  )}
                  <p className="text-white text-sm truncate">{post.title}</p>
                </div>
                <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
                  {post.category ?? '—'} · {post.slug}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(post)}
                className="rounded-none"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm(`Excluir "${post.title}"?`)) del.mutate(post.id)
                }}
                className="rounded-none text-red-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <BlogEditor
          initial={editing === 'new' ? null : editing}
          saving={save.isPending}
          onSave={(data) =>
            save.mutate(
              editing === 'new' ? data : { ...data, id: editing.id },
              { onSuccess: () => setEditing(null) },
            )
          }
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}

function HelpManager() {
  const { data: articles = [], isLoading } = useAdminHelpArticles()
  const save = useSaveHelpArticle()
  const del = useDeleteContent('help')
  const [editing, setEditing] = useState<HelpArticleRow | 'new' | null>(null)

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <p className="font-mono text-[10px] text-white/40 tracking-widest uppercase">
          {isLoading ? 'Carregando…' : `${articles.length} artigos`}
        </p>
        <Button variant="primary" onClick={() => setEditing('new')}>
          <Plus className="w-4 h-4 mr-2" /> Novo artigo
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="border border-white/5 py-16 text-center text-white/40 text-sm">
          Nenhum artigo ainda.
        </div>
      ) : (
        <div className="border border-white/10 bg-white/[0.02] divide-y divide-white/5">
          {articles.map((article) => (
            <div
              key={article.id}
              className="flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {article.is_published ? (
                    <Eye className="w-3 h-3 text-green-500/70" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-white/30" />
                  )}
                  <p className="text-white text-sm truncate">{article.title}</p>
                </div>
                <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
                  {article.category} · {article.slug ?? 'sem slug'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(article)}
                className="rounded-none"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm(`Excluir "${article.title}"?`)) del.mutate(article.id)
                }}
                className="rounded-none text-red-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <HelpEditor
          initial={editing === 'new' ? null : editing}
          saving={save.isPending}
          onSave={(data) =>
            save.mutate(
              editing === 'new' ? data : { ...data, id: editing.id },
              { onSuccess: () => setEditing(null) },
            )
          }
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}

function BlogEditor({
  initial,
  saving,
  onSave,
  onClose,
}: {
  initial: BlogPostRow | null
  saving: boolean
  onSave: (data: Partial<BlogPostRow>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    excerpt: initial?.excerpt ?? '',
    content: initial?.content ?? '',
    category: initial?.category ?? 'CARREIRA',
    image_url: initial?.image_url ?? '',
    read_time: initial?.read_time ?? '5 min',
    is_featured: initial?.is_featured ?? false,
    is_published: initial?.is_published ?? true,
  })
  const [showPreview, setShowPreview] = useState(false)

  const handleTitle = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: initial?.slug ?? slugify(title),
    }))
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-black border border-white/10 rounded-none text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl tracking-wide">
            {initial ? 'Editar post' : 'Novo post'}
          </DialogTitle>
        </DialogHeader>

        <ContentPreview
          open={showPreview}
          onClose={() => setShowPreview(false)}
          variant="blog"
          title={form.title}
          excerpt={form.excerpt}
          category={form.category}
          imageUrl={form.image_url}
          author="KHAOS KONTROL Editorial"
          content={form.content}
        />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Título
              </Label>
              <Input
                value={form.title}
                onChange={(e) => handleTitle(e.target.value)}
                className="rounded-none bg-white/[0.03] border-white/10"
              />
            </div>

            <div>
              <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Slug
              </Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="rounded-none bg-white/[0.03] border-white/10 font-mono text-xs"
              />
            </div>

            <div>
              <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Categoria
              </Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-none bg-white/[0.03] border-white/10 font-mono"
              />
            </div>

            <div>
              <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Imagem de capa
              </Label>
              <ImageUrlInput
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
              />
            </div>

            <div>
              <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Tempo de leitura
              </Label>
              <Input
                value={form.read_time}
                onChange={(e) => setForm({ ...form, read_time: e.target.value })}
                className="rounded-none bg-white/[0.03] border-white/10"
              />
            </div>

            <div className="col-span-2">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Excerpt
              </Label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={2}
                className="rounded-none bg-white/[0.03] border-white/10 resize-none"
              />
            </div>
          </div>

          <div>
            <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60 block mb-2">
              Conteúdo
            </Label>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2">
              <Switch
                checked={form.is_featured}
                onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
              />
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">
                Destaque
              </span>
            </label>
            <label className="flex items-center gap-2">
              <Switch
                checked={form.is_published}
                onCheckedChange={(v) => setForm({ ...form, is_published: v })}
              />
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">
                Publicado
              </span>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={!form.title && !form.content}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="primary"
            disabled={saving || !form.title || !form.slug || !form.content}
            onClick={() => onSave(form)}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function HelpEditor({
  initial,
  saving,
  onSave,
  onClose,
}: {
  initial: HelpArticleRow | null
  saving: boolean
  onSave: (data: Partial<HelpArticleRow>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    excerpt: initial?.excerpt ?? '',
    content: initial?.content ?? '',
    category: initial?.category ?? 'Geral',
    tags: (initial?.tags ?? []).join(', '),
    sort_order: initial?.sort_order ?? 0,
    is_published: initial?.is_published ?? true,
  })
  const [showPreview, setShowPreview] = useState(false)

  const handleTitle = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: initial?.slug ?? slugify(title),
    }))
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-black border border-white/10 rounded-none text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl tracking-wide">
            {initial ? 'Editar artigo' : 'Novo artigo'}
          </DialogTitle>
        </DialogHeader>

        <ContentPreview
          open={showPreview}
          onClose={() => setShowPreview(false)}
          variant="help"
          title={form.title}
          excerpt={form.excerpt}
          category={form.category}
          content={form.content}
        />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Título
              </Label>
              <Input
                value={form.title}
                onChange={(e) => handleTitle(e.target.value)}
                className="rounded-none bg-white/[0.03] border-white/10"
              />
            </div>

            <div>
              <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Slug
              </Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="rounded-none bg-white/[0.03] border-white/10 font-mono text-xs"
              />
            </div>

            <div>
              <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Categoria
              </Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-none bg-white/[0.03] border-white/10"
              />
            </div>

            <div>
              <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Ordem
              </Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
                className="rounded-none bg-white/[0.03] border-white/10 font-mono"
              />
            </div>

            <div>
              <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Tags (separadas por vírgula)
              </Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="rounded-none bg-white/[0.03] border-white/10 font-mono text-xs"
              />
            </div>

            <div className="col-span-2">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Excerpt
              </Label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={2}
                className="rounded-none bg-white/[0.03] border-white/10 resize-none"
              />
            </div>
          </div>

          <div>
            <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60 block mb-2">
              Conteúdo
            </Label>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
            />
          </div>

          <label className="flex items-center gap-2 pt-2">
            <Switch
              checked={form.is_published}
              onCheckedChange={(v) => setForm({ ...form, is_published: v })}
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">
              Publicado
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={!form.title && !form.content}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="primary"
            disabled={saving || !form.title || !form.content}
            onClick={() =>
              onSave({
                ...form,
                tags: form.tags
                  ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
                  : null,
              })
            }
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
