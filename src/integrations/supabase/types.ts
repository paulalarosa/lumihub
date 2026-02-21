export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analytics_logs: {
        Row: {
          client_id: string | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "wedding_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          assistant_commission: number | null
          assistant_id: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          end_time: string
          event_type: string | null
          id: string
          start_time: string
          status: string | null
          title: string
          total_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assistant_commission?: number | null
          assistant_id?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          event_type?: string | null
          id?: string
          start_time: string
          status?: string | null
          title: string
          total_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assistant_commission?: number | null
          assistant_id?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          event_type?: string | null
          id?: string
          start_time?: string
          status?: string | null
          title?: string
          total_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_access: {
        Row: {
          assistant_id: string
          granted_at: string | null
          id: string
          makeup_artist_id: string
          revoked_at: string | null
          status: string | null
        }
        Insert: {
          assistant_id: string
          granted_at?: string | null
          id?: string
          makeup_artist_id: string
          revoked_at?: string | null
          status?: string | null
        }
        Update: {
          assistant_id?: string
          granted_at?: string | null
          id?: string
          makeup_artist_id?: string
          revoked_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistant_access_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_access_makeup_artist_id_fkey"
            columns: ["makeup_artist_id"]
            isOneToOne: false
            referencedRelation: "makeup_artists"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_invites: {
        Row: {
          accepted_at: string | null
          assistant_email: string
          created_at: string | null
          email_status: string | null
          expires_at: string | null
          id: string
          invite_token: string
          makeup_artist_id: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          assistant_email: string
          created_at?: string | null
          email_status?: string | null
          expires_at?: string | null
          id?: string
          invite_token?: string
          makeup_artist_id: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          assistant_email?: string
          created_at?: string | null
          email_status?: string | null
          expires_at?: string | null
          id?: string
          invite_token?: string
          makeup_artist_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistant_invites_makeup_artist_id_fkey"
            columns: ["makeup_artist_id"]
            isOneToOne: false
            referencedRelation: "makeup_artists"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_notifications: {
        Row: {
          action_link: string | null
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          action_link?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action_link?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      assistants: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          is_upgraded: boolean | null
          phone: string | null
          updated_at: string | null
          upgraded_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          is_upgraded?: boolean | null
          phone?: string | null
          updated_at?: string | null
          upgraded_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          is_upgraded?: boolean | null
          phone?: string | null
          updated_at?: string | null
          upgraded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assistants_legacy: {
        Row: {
          assistant_user_id: string | null
          created_at: string | null
          email: string
          id: string
          invite_token: string | null
          is_registered: boolean | null
          name: string | null
          phone: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          assistant_user_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          invite_token?: string | null
          is_registered?: boolean | null
          name?: string | null
          phone?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          assistant_user_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          invite_token?: string | null
          is_registered?: boolean | null
          name?: string | null
          phone?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          source: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          source?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          source?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_archive: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          source: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          source?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          source?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      backup_integrity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bride_access: {
        Row: {
          access_token: string | null
          bride_name: string | null
          client_id: string | null
          created_at: string | null
          event_date: string | null
          id: string
          professional_id: string | null
        }
        Insert: {
          access_token?: string | null
          bride_name?: string | null
          client_id?: string | null
          created_at?: string | null
          event_date?: string | null
          id?: string
          professional_id?: string | null
        }
        Update: {
          access_token?: string | null
          bride_name?: string | null
          client_id?: string | null
          created_at?: string | null
          event_date?: string | null
          id?: string
          professional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bride_access_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bride_access_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      briefings: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          project_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          project_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          project_id?: string | null
          status?: string | null
          user_id?: string | null
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
      calendar_events: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string
          event_type: string | null
          google_calendar_id: string | null
          google_event_id: string | null
          id: string
          is_synced: boolean | null
          last_synced_at: string | null
          location: string | null
          project_id: string | null
          start_time: string
          status: string | null
          sync_error: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time: string
          event_type?: string | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          is_synced?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          project_id?: string | null
          start_time: string
          status?: string | null
          sync_error?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string
          event_type?: string | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          is_synced?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          project_id?: string | null
          start_time?: string
          status?: string | null
          sync_error?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          attachment_url: string | null
          client_id: string | null
          content: string | null
          created_at: string | null
          id: string
          project_id: string | null
          signature_data: string | null
          signature_ip: string | null
          signature_url: string | null
          signed_at: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          signature_data?: string | null
          signature_ip?: string | null
          signature_url?: string | null
          signed_at?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          signature_data?: string | null
          signature_ip?: string | null
          signature_url?: string | null
          signed_at?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "wedding_clients"
            referencedColumns: ["id"]
          },
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
          created_at: string | null
          event_id: string
        }
        Insert: {
          assistant_id: string
          created_at?: string | null
          event_id: string
        }
        Update: {
          assistant_id?: string
          created_at?: string | null
          event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistants"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistants"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assistants_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assistants_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          assistant_commission: number | null
          assistant_id: string | null
          ceremony_time: string | null
          client_id: string | null
          color: string | null
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string | null
          id: string
          latitude: string | null
          location: string | null
          longitude: string | null
          making_of_time: string | null
          notes: string | null
          project_id: string | null
          reminder_days: string | null
          start_time: string | null
          status: string | null
          tags: string[] | null
          title: string
          total_value: number | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          advisory_time?: string | null
          arrival_time?: string | null
          assistant_commission?: number | null
          assistant_id?: string | null
          ceremony_time?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string | null
          id?: string
          latitude?: string | null
          location?: string | null
          longitude?: string | null
          making_of_time?: string | null
          notes?: string | null
          project_id?: string | null
          reminder_days?: string | null
          start_time?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          total_value?: number | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          advisory_time?: string | null
          arrival_time?: string | null
          assistant_commission?: number | null
          assistant_id?: string | null
          ceremony_time?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string | null
          id?: string
          latitude?: string | null
          location?: string | null
          longitude?: string | null
          making_of_time?: string | null
          notes?: string | null
          project_id?: string | null
          reminder_days?: string | null
          start_time?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          total_value?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "wedding_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      financial_overview: {
        Row: {
          id: string
          month: string | null
          net_profit: number | null
          total_payouts: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          month?: string | null
          net_profit?: number | null
          total_payouts?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          month?: string | null
          net_profit?: number | null
          total_payouts?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          calendar_id: string | null
          channel_expiry: string | null
          channel_id: string | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          refresh_token: string
          resource_id: string | null
          sync_token: string | null
          token_expiry: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          channel_expiry?: string | null
          channel_id?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          refresh_token: string
          resource_id?: string | null
          sync_token?: string | null
          token_expiry: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          channel_expiry?: string | null
          channel_id?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          refresh_token?: string
          resource_id?: string | null
          sync_token?: string | null
          token_expiry?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string | null
          paid_at: string | null
          project_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          project_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          project_id?: string | null
          status?: string | null
          user_id?: string | null
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
      leads: {
        Row: {
          client_name: string
          created_at: string | null
          email: string | null
          email_status: string | null
          id: string
          status: string | null
          user_id: string | null
          value: number | null
        }
        Insert: {
          client_name: string
          created_at?: string | null
          email?: string | null
          email_status?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
          value?: number | null
        }
        Update: {
          client_name?: string
          created_at?: string | null
          email?: string | null
          email_status?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      makeup_artists: {
        Row: {
          business_name: string
          created_at: string | null
          id: string
          phone: string | null
          plan_type: string | null
          subscription_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_name: string
          created_at?: string | null
          id?: string
          phone?: string | null
          plan_type?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_name?: string
          created_at?: string | null
          id?: string
          phone?: string | null
          plan_type?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          created_at: string | null
          id: string
          name: string
          scheduled_for: string | null
          status: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          scheduled_for?: string | null
          status?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          scheduled_for?: string | null
          status?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          organization_id: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      moodboard_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          project_id: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          project_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          project_id?: string | null
          title?: string | null
          user_id?: string | null
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
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          notification_id: string | null
          provider_id: string | null
          recipient: string | null
          status: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_id?: string | null
          provider_id?: string | null
          recipient?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_id?: string | null
          provider_id?: string | null
          recipient?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "assistant_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          paid_at: string | null
          payment_method: string | null
          payment_type: string | null
          status: string
          subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_type?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_type?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          bank_info: Json | null
          created_at: string | null
          id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          bank_info?: Json | null
          created_at?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          bank_info?: Json | null
          created_at?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          business_name: string | null
          city: string | null
          created_at: string | null
          document_id: string | null
          email: string | null
          email_status: string | null
          financial_goal: number | null
          first_name: string | null
          full_name: string | null
          google_calendar_connected: boolean | null
          growth_client_percentage: number | null
          has_completed_onboarding: boolean | null
          id: string
          last_name: string | null
          name: string | null
          onboarding_completed: boolean | null
          parent_user_id: string | null
          phone: string | null
          plan: string | null
          "profiles.role": string | null
          role: string | null
          slug: string | null
          state: string | null
          subscription_status: string | null
          subscription_tier: string | null
          total_clients: number | null
          "updated_at'": string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string | null
          document_id?: string | null
          email?: string | null
          email_status?: string | null
          financial_goal?: number | null
          first_name?: string | null
          full_name?: string | null
          google_calendar_connected?: boolean | null
          growth_client_percentage?: number | null
          has_completed_onboarding?: boolean | null
          id: string
          last_name?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          parent_user_id?: string | null
          phone?: string | null
          plan?: string | null
          "profiles.role"?: string | null
          role?: string | null
          slug?: string | null
          state?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_clients?: number | null
          "updated_at'"?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string | null
          document_id?: string | null
          email?: string | null
          email_status?: string | null
          financial_goal?: number | null
          first_name?: string | null
          full_name?: string | null
          google_calendar_connected?: boolean | null
          growth_client_percentage?: number | null
          has_completed_onboarding?: boolean | null
          id?: string
          last_name?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          parent_user_id?: string | null
          phone?: string | null
          plan?: string | null
          "profiles.role"?: string | null
          role?: string | null
          slug?: string | null
          state?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_clients?: number | null
          "updated_at'"?: string | null
        }
        Relationships: []
      }
      project_services: {
        Row: {
          created_at: string | null
          id: string
          price: number | null
          project_id: string | null
          quantity: string | null
          service_id: string | null
          total_price: string | null
          unit_price: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          price?: number | null
          project_id?: string | null
          quantity?: string | null
          service_id?: string | null
          total_price?: string | null
          unit_price?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          price?: number | null
          project_id?: string | null
          quantity?: string | null
          service_id?: string | null
          total_price?: string | null
          unit_price?: number | null
          user_id?: string | null
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
          budget: number | null
          client_id: string | null
          "clients_1.cpf": string | null
          cover_url: string | null
          created_at: string
          deadline: string | null
          description: string | null
          details: string | null
          end_date: string | null
          event_date: string | null
          event_location: string | null
          event_time: string | null
          event_type: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          priority: string | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          total_budget: number | null
          total_value: number | null
          type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          budget?: number | null
          client_id?: string | null
          "clients_1.cpf"?: string | null
          cover_url?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          details?: string | null
          end_date?: string | null
          event_date?: string | null
          event_location?: string | null
          event_time?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          priority?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          total_budget?: number | null
          total_value?: number | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          budget?: number | null
          client_id?: string | null
          "clients_1.cpf"?: string | null
          cover_url?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          details?: string | null
          end_date?: string | null
          event_date?: string | null
          event_location?: string | null
          event_time?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          priority?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          total_budget?: number | null
          total_value?: number | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_clients"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "wedding_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number | null
          created_at: string
          default_price: string | null
          description: string | null
          duration_minutes: string | null
          id: string
          is_active: string | null
          name: string | null
          price: string | null
          sort_order: number | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          base_price?: number | null
          created_at?: string
          default_price?: string | null
          description?: string | null
          duration_minutes?: string | null
          id?: string
          is_active?: string | null
          name?: string | null
          price?: string | null
          sort_order?: number | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          base_price?: number | null
          created_at?: string
          default_price?: string | null
          description?: string | null
          duration_minutes?: string | null
          id?: string
          is_active?: string | null
          name?: string | null
          price?: string | null
          sort_order?: number | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string
          current_period_start: string
          id: string
          mp_payer_id: string | null
          mp_preference_id: string | null
          mp_subscription_id: string | null
          plan_type: string
          price_monthly: number
          status: string
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          mp_payer_id?: string | null
          mp_preference_id?: string | null
          mp_subscription_id?: string | null
          plan_type?: string
          price_monthly: number
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          mp_payer_id?: string | null
          mp_preference_id?: string | null
          mp_subscription_id?: string | null
          plan_type?: string
          price_monthly?: number
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sync_log: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_id: string | null
          google_event_id: string | null
          id: string
          operation: string
          success: boolean
          sync_direction: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_id?: string | null
          google_event_id?: string | null
          id?: string
          operation: string
          success: boolean
          sync_direction: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_id?: string | null
          google_event_id?: string | null
          id?: string
          operation?: string
          success?: boolean
          sync_direction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          created_at: string
          id: string
          key: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value?: Json
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string | null
          id: string
          level: string | null
          message: string | null
          metadata: string | null
          severity: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: string | null
          message?: string | null
          metadata?: string | null
          severity?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string | null
          message?: string | null
          metadata?: string | null
          severity?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: string | null
          sort_order: number | null
          status: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          sort_order?: number | null
          status?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          sort_order?: number | null
          status?: string | null
          title?: string
          user_id?: string | null
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
      team_invites: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          role: string | null
          status: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          role?: string | null
          status?: string | null
          token?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          role?: string | null
          status?: string | null
          token?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          is_registered: boolean | null
          owner_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_registered?: boolean | null
          owner_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_registered?: boolean | null
          owner_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          assistant_id: string | null
          category: string | null
          created_at: string
          date: string | null
          description: string
          id: string
          net_amount: number | null
          payment_method: string | null
          project_id: string | null
          service_id: string | null
          type: string | null
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          assistant_id?: string | null
          category?: string | null
          created_at?: string
          date?: string | null
          description: string
          id?: string
          net_amount?: number | null
          payment_method?: string | null
          project_id?: string | null
          service_id?: string | null
          type?: string | null
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          assistant_id?: string | null
          category?: string | null
          created_at?: string
          date?: string | null
          description?: string
          id?: string
          net_amount?: number | null
          payment_method?: string | null
          project_id?: string | null
          service_id?: string | null
          type?: string | null
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          provider: string
          refresh_token: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string
          id: string
          name: string
          type: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          id?: string
          name: string
          type?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          id?: string
          name?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wedding_clients: {
        Row: {
          access_pin: string | null
          address: string | null
          assistant_commission: string | null
          avatar_url: string | null
          bride_status: boolean | null
          cpf: string | null
          created_at: string | null
          email: string | null
          email_status: string | null
          full_name: string | null
          id: string
          instagram: string | null
          is_bride: boolean | null
          last_visit: string | null
          moodboard_url: string | null
          name: string | null
          notes: string | null
          origin: string | null
          parent_user_id: string | null
          phone: string | null
          portal_link: string | null
          secret_code: string | null
          status: string | null
          user_id: string | null
          wedding_date: string | null
        }
        Insert: {
          access_pin?: string | null
          address?: string | null
          assistant_commission?: string | null
          avatar_url?: string | null
          bride_status?: boolean | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          email_status?: string | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          is_bride?: boolean | null
          last_visit?: string | null
          moodboard_url?: string | null
          name?: string | null
          notes?: string | null
          origin?: string | null
          parent_user_id?: string | null
          phone?: string | null
          portal_link?: string | null
          secret_code?: string | null
          status?: string | null
          user_id?: string | null
          wedding_date?: string | null
        }
        Update: {
          access_pin?: string | null
          address?: string | null
          assistant_commission?: string | null
          avatar_url?: string | null
          bride_status?: boolean | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          email_status?: string | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          is_bride?: boolean | null
          last_visit?: string | null
          moodboard_url?: string | null
          name?: string | null
          notes?: string | null
          origin?: string | null
          parent_user_id?: string | null
          phone?: string | null
          portal_link?: string | null
          secret_code?: string | null
          status?: string | null
          user_id?: string | null
          wedding_date?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      clients: {
        Row: {
          birth_date: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          phone: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          phone?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_assistant_invite: {
        Args: { p_invite_token: string; p_user_id?: string }
        Returns: Json
      }
      archive_old_audit_logs: {
        Args: { retention_days?: number }
        Returns: undefined
      }
      check_assistant_exists: { Args: { p_email: string }; Returns: Json }
      create_assistant_invite: {
        Args: { p_assistant_email: string; p_makeup_artist_id: string }
        Returns: Json
      }
      enable_auditing: {
        Args: { table_name_input: string }
        Returns: undefined
      }
      get_active_subscription: {
        Args: { p_user_id: string }
        Returns: {
          current_period_end: string
          id: string
          plan_type: string
          status: string
        }[]
      }
      get_bride_dashboard_data:
        | { Args: { p_client_id: string }; Returns: Json }
        | { Args: { p_client_id: string; p_pin: string }; Returns: Json }
      has_active_subscription: { Args: { p_user_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      send_templated_email: {
        Args: {
          recipient: string
          template_data: Json
          template_name: string
          user_id?: string
        }
        Returns: undefined
      }
      set_audit_source: { Args: { source_text: string }; Returns: undefined }
      validate_bride_pin: {
        Args: { client_id: string; pin_code: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "editor" | "viewer"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      user_role: ["admin", "editor", "viewer"],
    },
  },
} as const

