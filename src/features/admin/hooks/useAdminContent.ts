import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { logger } from '@/services/logger'

export type ContentType = 'blog' | 'help'

export interface BlogPostRow {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  category: string | null
  image_url: string | null
  read_time: string | null
  is_featured: boolean
  is_published: boolean
  published_at: string
}

export interface HelpArticleRow {
  id: string
  slug: string | null
  title: string
  excerpt: string | null
  content: string
  category: string
  tags: string[] | null
  is_published: boolean
  sort_order: number
  updated_at: string | null
}

export function useAdminBlogPosts() {
  return useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async (): Promise<BlogPostRow[]> => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, content, category, image_url, read_time, is_featured, is_published, published_at')
        .order('published_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((r) => ({
        ...r,
        is_featured: !!r.is_featured,
        is_published: !!r.is_published,
      }))
    },
  })
}

export function useAdminHelpArticles() {
  return useQuery({
    queryKey: ['admin-help-articles'],
    queryFn: async (): Promise<HelpArticleRow[]> => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('id, slug, title, excerpt, content, category, tags, is_published, sort_order, updated_at')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []).map((r) => ({
        ...r,
        is_published: r.is_published ?? true,
        sort_order: r.sort_order ?? 0,
      }))
    },
  })
}

export function useSaveBlogPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<BlogPostRow> & { id?: string }) => {
      const { id, ...fields } = input
      if (id) {
        const { error } = await supabase.from('blog_posts').update(fields).eq('id', id)
        if (error) throw error
      } else {
        const insertFields = {
          slug: fields.slug!,
          title: fields.title!,
          content: fields.content!,
          excerpt: fields.excerpt ?? null,
          category: fields.category ?? null,
          image_url: fields.image_url ?? null,
          read_time: fields.read_time ?? null,
          is_featured: fields.is_featured ?? false,
          is_published: fields.is_published ?? true,
          published_at: fields.published_at ?? new Date().toISOString(),
        }
        const { error } = await supabase.from('blog_posts').insert(insertFields)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog-posts'] })
      qc.invalidateQueries({ queryKey: ['blog-posts'] })
      toast.success('Post salvo')
    },
    onError: (err: Error) => {
      logger.error(err, 'useSaveBlogPost')
      toast.error('Erro ao salvar: ' + err.message)
    },
  })
}

export function useSaveHelpArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<HelpArticleRow> & { id?: string }) => {
      const { id, ...fields } = input
      if (id) {
        const { error } = await supabase.from('knowledge_base').update(fields).eq('id', id)
        if (error) throw error
      } else {
        const insertFields = {
          slug: fields.slug ?? null,
          title: fields.title!,
          content: fields.content!,
          category: fields.category!,
          excerpt: fields.excerpt ?? null,
          tags: fields.tags ?? null,
          is_published: fields.is_published ?? true,
          sort_order: fields.sort_order ?? 0,
        }
        const { error } = await supabase.from('knowledge_base').insert(insertFields)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-help-articles'] })
      qc.invalidateQueries({ queryKey: ['help-articles'] })
      toast.success('Artigo salvo')
    },
    onError: (err: Error) => {
      logger.error(err, 'useSaveHelpArticle')
      toast.error('Erro ao salvar: ' + err.message)
    },
  })
}

export function useDeleteContent(type: ContentType) {
  const qc = useQueryClient()
  const table = type === 'blog' ? 'blog_posts' : 'knowledge_base'
  const listKey = type === 'blog' ? 'admin-blog-posts' : 'admin-help-articles'
  const publicKey = type === 'blog' ? 'blog-posts' : 'help-articles'

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [listKey] })
      qc.invalidateQueries({ queryKey: [publicKey] })
      toast.success('Excluído')
    },
    onError: (err: Error) => {
      logger.error(err, 'useDeleteContent')
      toast.error('Erro ao excluir: ' + err.message)
    },
  })
}
