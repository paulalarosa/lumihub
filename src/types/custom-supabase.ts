import { SupabaseClient } from '@supabase/supabase-js'
import { AuditDatabase } from './audit'

export type CustomFunctions = {
  save_push_subscription: {
    Args: {
      p_endpoint: string
      p_p256dh: string
      p_auth: string
      p_user_agent: string
    }
    Returns: void
  }
  remove_push_subscription: {
    Args: {
      p_endpoint: string
    }
    Returns: void
  }
}

export type CustomDatabase = {
  public: {
    Tables: AuditDatabase['public']['Tables']
    Views: AuditDatabase['public']['Views']
    Functions: AuditDatabase['public']['Functions'] & CustomFunctions
    Enums: AuditDatabase['public']['Enums']
    CompositeTypes: AuditDatabase['public']['CompositeTypes']
  }
}

export type TypedSupabaseClient = SupabaseClient<CustomDatabase>
