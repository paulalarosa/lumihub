import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface HelpArticle {
  id: string
  slug: string
  title: string
  category: string
  excerpt: string | null
  content: string
  tags: string[] | null
  updated_at: string | null
}

interface KnowledgeBaseRow {
  id: string
  slug: string | null
  title: string
  category: string
  excerpt: string | null
  content: string
  tags: string[] | null
  updated_at: string | null
}

const mapRow = (row: KnowledgeBaseRow): HelpArticle | null => {
  if (!row.slug) return null
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    content: row.content,
    tags: row.tags,
    updated_at: row.updated_at,
  }
}

export function useHelpArticles(search?: string) {
  return useQuery({
    queryKey: ['help-articles', search ?? ''],
    queryFn: async (): Promise<HelpArticle[]> => {
      let query = supabase
        .from('knowledge_base')
        .select('id, slug, title, category, excerpt, content, tags, updated_at')
        .eq('is_published', true)
        .not('slug', 'is', null)
        .order('sort_order', { ascending: true })

      if (search && search.trim().length > 1) {
        const pattern = `%${search.trim()}%`
        query = query.or(`title.ilike.${pattern},excerpt.ilike.${pattern},content.ilike.${pattern}`)
      }

      const { data, error } = await query
      if (error) throw error
      return ((data ?? []) as KnowledgeBaseRow[])
        .map(mapRow)
        .filter((a): a is HelpArticle => a !== null)
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useHelpArticle(slug: string | undefined) {
  return useQuery({
    queryKey: ['help-article', slug],
    queryFn: async (): Promise<HelpArticle | null> => {
      if (!slug) return null
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('id, slug, title, category, excerpt, content, tags, updated_at')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle()
      if (error) throw error
      return data ? mapRow(data as KnowledgeBaseRow) : null
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}
