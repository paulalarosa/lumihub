import { supabase } from '@/integrations/supabase/client'
import { Microsite, Service } from '@/types'
import { logger } from '@/services/logger'

// Domain Types
// Domain Types
// export interface MicrositeService extends Service {}
// Removed empty interface causing lint error

export interface MicrositeTestimonial {
  id: string
  client_name: string
  client_photo_url: string | null
  rating: number | null
  text: string
  event_type: string | null
  display_order: number
  is_visible: boolean
}

export interface MicrositeGalleryItem {
  id: string
  image_url: string
  thumbnail_url: string | null
  caption: string | null
  category: string | null
  is_featured: boolean
  display_order: number
}

export interface MicrositeData extends Microsite {
  // Fields potentially missing from generated types but likely in DB
  enable_reviews?: boolean
  enable_gallery?: boolean
  enable_services?: boolean
  enable_about?: boolean
  enable_contact?: boolean

  // Virtual or Joined fields
  services: Service[]
  gallery: MicrositeGalleryItem[]
  testimonials: MicrositeTestimonial[]

  // Frontend aliases (if needed compatibility)
  bio?: string | null // Mapped from about_text?
}

export const MicrositeService = {
  /**
   * Fetches public microsite data by slug
   * Uses strict typing from database.types.ts
   */
  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from('microsites')
      .select(
        `
                *,
                services:microsite_services(*),
                gallery:microsite_gallery(*),
                testimonials:microsite_testimonials(*)
            `,
      )
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()

    if (error) {
      logger.error(error, 'Error fetching microsite', { slug })
      throw error
    }

    return data
  },

  /**
   * Increments the view count for a microsite
   * Uses RPC to be atomic/safe
   */
  async incrementViews(id: string) {
    const { error } = await supabase.rpc('increment_microsite_views', {
      p_microsite_id: id,
    })

    if (error) {
      logger.error(error, 'Error incrementing views', { micrositeId: id })
    }
    return !error
  },
}
