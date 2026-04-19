import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface MicrositeInstagramPost {
  id: string
  media_url: string | null
  media_type: string | null
  caption: string | null
  permalink: string | null
  timestamp: string | null
  like_count: number | null
}

export function useMicrositeInstagram(userId: string | undefined, limit = 12) {
  return useQuery({
    queryKey: ['microsite-instagram', userId, limit],
    queryFn: async (): Promise<MicrositeInstagramPost[]> => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('instagram_posts')
        .select(
          'id, media_url, media_type, caption, permalink, timestamp, like_count',
        )
        .eq('user_id', userId)
        .not('media_url', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  })
}
