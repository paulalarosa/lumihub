import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  category: string | null
  image_url: string | null
  author: string | null
  read_time: string | null
  is_featured: boolean
  published_at: string
}

const mapRow = (row: {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  category: string | null
  image_url: string | null
  author: string | null
  read_time: string | null
  is_featured: boolean | null
  published_at: string | null
}): BlogPost => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  content: row.content,
  category: row.category,
  image_url: row.image_url,
  author: row.author,
  read_time: row.read_time,
  is_featured: !!row.is_featured,
  published_at: row.published_at ?? new Date().toISOString(),
})

export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: async (): Promise<BlogPost[]> => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, content, category, image_url, author, read_time, is_featured, published_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false })

      if (error) throw error
      return (data ?? []).map(mapRow)
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async (): Promise<BlogPost | null> => {
      if (!slug) return null
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, content, category, image_url, author, read_time, is_featured, published_at')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle()

      if (error) throw error
      return data ? mapRow(data) : null
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}
