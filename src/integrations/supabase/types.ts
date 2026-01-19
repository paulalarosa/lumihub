export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assistant_notifications: {
        Row: {
          assistant_id: string
          created_at: string | null
          event_id: string
          id: string
          is_read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          assistant_id: string
          created_at?: string | null
          event_id: string
          id?: string
          is_read?: boolean | null
          type?: string
          user_id: string
        }
        Update: {
          assistant_id?: string
          created_at?: string | null
          event_id?: string
          id?: string
          is_read?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_notifications_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      assistants: {
        Row: {
          assistant_user_id: string | null
          created_at: string
          email: string | null
          has_pro_access: boolean | null
          id: string
          invite_token: string | null
          is_registered: boolean | null
          name: string
          phone: string | null
          updated_at: string
          upgraded_at: string | null
          user_id: string
        }
        Insert: {
          assistant_user_id?: string | null
          created_at?: string
          email?: string | null
          has_pro_access?: boolean | null
          id?: string
          invite_token?: string | null
          is_registered?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string
          upgraded_at?: string | null
          user_id: string
        }
        Update: {
          assistant_user_id?: string | null
          created_at?: string
          email?: string | null
          has_pro_access?: boolean | null
          id?: string
          invite_token?: string | null
          is_registered?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string
          upgraded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      briefings: {
        Row: {
          answers: Json
          created_at: string
          id: string
          is_submitted: boolean
          project_id: string
          questions: Json
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          is_submitted?: boolean
          project_id: string
          questions?: Json
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          is_submitted?: boolean
          project_id?: string
          questions?: Json
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_interactions: {
        Row: {
          client_id: string
          content: string
          created_at: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          id?: string
          type?: string
          user_id: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          instagram: string | null
          name: string
          notes: string | null
          phone: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          signature_data: string | null
          signed_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          signature_data?: string | null
          signed_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          signature_data?: string | null
          signed_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      event_assistants: {
        Row: {
          assistant_id: string
          created_at: string
          event_id: string
          id: string
          notified_at: string | null
        }
        Insert: {
          assistant_id: string
          created_at?: string
          event_id: string
          id?: string
          notified_at?: string | null
        }
        Update: {
          assistant_id?: string
          created_at?: string
          event_id?: string
          id?: string
          notified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_assistants_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assistants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          advisory_time: string | null
          arrival_time: string | null
          ceremony_time: string | null
          client_id: string | null
          color: string | null
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string | null
          google_calendar_event_id: string | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          making_of_time: string | null
          notes: string | null
          project_id: string | null
          reminder_days: number[] | null
          start_time: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          advisory_time?: string | null
          arrival_time?: string | null
          ceremony_time?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string | null
          google_calendar_event_id?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          making_of_time?: string | null
          notes?: string | null
          project_id?: string | null
          reminder_days?: number[] | null
          start_time?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          advisory_time?: string | null
          arrival_time?: string | null
          ceremony_time?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string | null
          google_calendar_event_id?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          making_of_time?: string | null
          notes?: string | null
          project_id?: string | null
          reminder_days?: number[] | null
          start_time?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          project_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          project_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          project_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      moodboard_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          project_id: string
          uploaded_by: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          project_id: string
          uploaded_by?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          project_id?: string
          uploaded_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moodboard_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          event_id: string | null
          id: string
          notification_type: string
          recipient_email: string
          sent_at: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          event_id?: string | null
          id?: string
          notification_type: string
          recipient_email: string
          sent_at?: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          event_id?: string | null
          id?: string
          notification_type?: string
          recipient_email?: string
          sent_at?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          notify_assistant_assigned: boolean
          notify_event_cancel: boolean
          notify_event_update: boolean
          notify_new_event: boolean
          reminder_days: number[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          notify_assistant_assigned?: boolean
          notify_event_cancel?: boolean
          notify_event_update?: boolean
          notify_new_event?: boolean
          reminder_days?: number[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          notify_assistant_assigned?: boolean
          notify_event_cancel?: boolean
          notify_event_update?: boolean
          notify_new_event?: boolean
          reminder_days?: number[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_accounts: {
        Row: {
          account_holder_document: string | null
          account_holder_name: string | null
          account_number: string | null
          account_type: string | null
          agency: string | null
          bank_code: string | null
          bank_name: string | null
          created_at: string
          digital_wallet_account: string | null
          digital_wallet_type: string | null
          id: string
          pix_key: string | null
          pix_key_type: string | null
          preferred_method: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_document?: string | null
          account_holder_name?: string | null
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string
          digital_wallet_account?: string | null
          digital_wallet_type?: string | null
          id?: string
          pix_key?: string | null
          pix_key_type?: string | null
          preferred_method?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_document?: string | null
          account_holder_name?: string | null
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string
          digital_wallet_account?: string | null
          digital_wallet_type?: string | null
          id?: string
          pix_key?: string | null
          pix_key_type?: string | null
          preferred_method?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      professional_settings: {
        Row: {
          bio: string | null
          business_name: string | null
          created_at: string
          id: string
          instagram: string | null
          is_public: boolean
          logo_url: string | null
          phone: string | null
          primary_color: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          bio?: string | null
          business_name?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          is_public?: boolean
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          bio?: string | null
          business_name?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          is_public?: boolean
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          onboarding_completed: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      project_services: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          paid_amount: number
          project_id: string
          quantity: number
          service_id: string
          total_price: number
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          paid_amount?: number
          project_id: string
          quantity?: number
          service_id: string
          total_price: number
          unit_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          paid_amount?: number
          project_id?: string
          quantity?: number
          service_id?: string
          total_price?: number
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_services_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          event_date: string | null
          event_location: string | null
          event_type: string | null
          id: string
          name: string
          notes: string | null
          public_token: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          event_date?: string | null
          event_location?: string | null
          event_type?: string | null
          id?: string
          name: string
          notes?: string | null
          public_token?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          event_date?: string | null
          event_location?: string | null
          event_type?: string | null
          id?: string
          name?: string
          notes?: string | null
          public_token?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean
          name: string
          price: number | null
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean
          project_id: string
          sort_order: number
          title: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          project_id: string
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          project_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          created_at: string
          google_channel_expiration: string | null
          google_channel_id: string | null
          google_resource_id: string | null
          id: string
          is_active: boolean
          last_sync_at: string | null
          provider: string
          refresh_token: string | null
          sync_enabled: boolean
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string
          google_channel_expiration?: string | null
          google_channel_id?: string | null
          google_resource_id?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          provider: string
          refresh_token?: string | null
          sync_enabled?: boolean
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string
          google_channel_expiration?: string | null
          google_channel_id?: string | null
          google_resource_id?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          provider?: string
          refresh_token?: string | null
          sync_enabled?: boolean
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_project_access: { Args: { _project_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_assistant_assigned_to_event: {
        Args: { _assistant_user_id: string; _event_id: string }
        Returns: boolean
      }
      is_assistant_for_project: {
        Args: { _assistant_user_id: string; _project_id: string }
        Returns: boolean
      }
      user_owns_event: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
