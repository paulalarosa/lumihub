import { Database } from '@/integrations/supabase/types'

export interface GeoCacheEntry {
  query: string
  response: {
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
  }
  expires_at?: string
}

export interface AssistantInvite {
  id: string
  email: string
  owner_id: string
  invite_code: string
  status: 'pending' | 'accepted' | 'revoked'
  created_at: string
  token?: string
}

export interface ProfessionalSettings {
  user_id: string
  bio?: string
  business_name?: string
  business_address?: string
  primary_color?: string
  slug?: string
}

export type CustomDatabase = Database & {
  public: {
    Tables: {
      geo_cache: {
        Row: GeoCacheEntry
        Insert: GeoCacheEntry
        Update: Partial<GeoCacheEntry>
      }
      assistant_invites: {
        Row: AssistantInvite
        Insert: AssistantInvite
        Update: Partial<AssistantInvite>
      }
      professional_settings: {
        Row: ProfessionalSettings
        Insert: ProfessionalSettings
        Update: Partial<ProfessionalSettings>
      }
    }
    Functions: {
      get_day_availability: {
        Args: { target_slug: string; query_date: string }
        Returns: {
          start_time: string
          end_time: string
          duration_minutes: number
        }[]
      }
    }
  }
}
