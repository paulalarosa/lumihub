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
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_id: string
          category: string | null
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number | null
          reward_message: string | null
        }
        Insert: {
          badge_id: string
          category?: string | null
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
          requirement_type: string
          requirement_value?: number | null
          reward_message?: string | null
        }
        Update: {
          badge_id?: string
          category?: string | null
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number | null
          reward_message?: string | null
        }
        Relationships: []
      }
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
            foreignKeyName: 'analytics_logs_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'wedding_clients'
            referencedColumns: ['id']
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
            foreignKeyName: 'appointments_assistant_id_fkey'
            columns: ['assistant_id']
            isOneToOne: false
            referencedRelation: 'assistants'
            referencedColumns: ['id']
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
            foreignKeyName: 'assistant_access_assistant_id_fkey'
            columns: ['assistant_id']
            isOneToOne: false
            referencedRelation: 'assistants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'assistant_access_makeup_artist_id_fkey'
            columns: ['makeup_artist_id']
            isOneToOne: false
            referencedRelation: 'makeup_artists'
            referencedColumns: ['id']
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
            foreignKeyName: 'assistant_invites_makeup_artist_id_fkey'
            columns: ['makeup_artist_id']
            isOneToOne: false
            referencedRelation: 'makeup_artists'
            referencedColumns: ['id']
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
            foreignKeyName: 'bride_access_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bride_access_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
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
            foreignKeyName: 'briefings_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
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
            foreignKeyName: 'calendar_events_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      chat_history: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      contextual_tips: {
        Row: {
          content: string
          created_at: string | null
          display_order: number | null
          element_selector: string | null
          id: string
          is_active: boolean | null
          page_path: string
          show_after_days: number | null
          show_when: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          display_order?: number | null
          element_selector?: string | null
          id?: string
          is_active?: boolean | null
          page_path: string
          show_after_days?: number | null
          show_when?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          display_order?: number | null
          element_selector?: string | null
          id?: string
          is_active?: boolean | null
          page_path?: string
          show_after_days?: number | null
          show_when?: string | null
          title?: string
        }
        Relationships: []
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
            foreignKeyName: 'contracts_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'wedding_clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contracts_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
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
            foreignKeyName: 'assistants'
            columns: ['assistant_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'assistants'
            columns: ['assistant_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'event_assistants_assistant_id_fkey'
            columns: ['assistant_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'event_assistants_assistant_id_fkey'
            columns: ['assistant_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'event_assistants_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
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
            foreignKeyName: 'event_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'wedding_clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'events_assistant_id_fkey'
            columns: ['assistant_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'events_assistant_id_fkey'
            columns: ['assistant_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'events_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
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
      instagram_connections: {
        Row: {
          access_token: string
          created_at: string | null
          followers_count: number | null
          following_count: number | null
          id: string
          instagram_user_id: string
          is_connected: boolean | null
          last_synced_at: string | null
          makeup_artist_id: string | null
          media_count: number | null
          profile_picture_url: string | null
          scopes: string[] | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          instagram_user_id: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          makeup_artist_id?: string | null
          media_count?: number | null
          profile_picture_url?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          instagram_user_id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          makeup_artist_id?: string | null
          media_count?: number | null
          profile_picture_url?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: 'instagram_connections_makeup_artist_id_fkey'
            columns: ['makeup_artist_id']
            isOneToOne: false
            referencedRelation: 'makeup_artists'
            referencedColumns: ['id']
          },
        ]
      }
      instagram_hashtag_suggestions: {
        Row: {
          avg_reach: number | null
          category: string
          created_at: string | null
          generated_by_ai: boolean | null
          hashtags: string[]
          id: string
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          avg_reach?: number | null
          category: string
          created_at?: string | null
          generated_by_ai?: boolean | null
          hashtags: string[]
          id?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          avg_reach?: number | null
          category?: string
          created_at?: string | null
          generated_by_ai?: boolean | null
          hashtags?: string[]
          id?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      instagram_messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          instagram_connection_id: string | null
          is_from_customer: boolean | null
          is_read: boolean | null
          message_text: string | null
          message_timestamp: string
          read_at: string | null
          recipient_id: string
          replied_at: string | null
          reply_text: string | null
          sender_id: string
          sender_username: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          instagram_connection_id?: string | null
          is_from_customer?: boolean | null
          is_read?: boolean | null
          message_text?: string | null
          message_timestamp: string
          read_at?: string | null
          recipient_id: string
          replied_at?: string | null
          reply_text?: string | null
          sender_id: string
          sender_username?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          instagram_connection_id?: string | null
          is_from_customer?: boolean | null
          is_read?: boolean | null
          message_text?: string | null
          message_timestamp?: string
          read_at?: string | null
          recipient_id?: string
          replied_at?: string | null
          reply_text?: string | null
          sender_id?: string
          sender_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'instagram_messages_instagram_connection_id_fkey'
            columns: ['instagram_connection_id']
            isOneToOne: false
            referencedRelation: 'instagram_connections'
            referencedColumns: ['id']
          },
        ]
      }
      instagram_post_templates: {
        Row: {
          caption_template: string
          category: string | null
          created_at: string | null
          hashtags: string[] | null
          id: string
          name: string
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          caption_template: string
          category?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          name: string
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          caption_template?: string
          category?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          name?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      instagram_posts: {
        Row: {
          caption: string | null
          comment_count: number | null
          created_at: string | null
          engagement_rate: number | null
          id: string
          impressions: number | null
          instagram_connection_id: string | null
          instagram_media_id: string
          last_synced_at: string | null
          like_count: number | null
          media_type: string | null
          media_url: string | null
          permalink: string | null
          reach: number | null
          saved_count: number | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          caption?: string | null
          comment_count?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          instagram_connection_id?: string | null
          instagram_media_id: string
          last_synced_at?: string | null
          like_count?: number | null
          media_type?: string | null
          media_url?: string | null
          permalink?: string | null
          reach?: number | null
          saved_count?: number | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          caption?: string | null
          comment_count?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          instagram_connection_id?: string | null
          instagram_media_id?: string
          last_synced_at?: string | null
          like_count?: number | null
          media_type?: string | null
          media_url?: string | null
          permalink?: string | null
          reach?: number | null
          saved_count?: number | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'instagram_posts_instagram_connection_id_fkey'
            columns: ['instagram_connection_id']
            isOneToOne: false
            referencedRelation: 'instagram_connections'
            referencedColumns: ['id']
          },
        ]
      }
      instagram_scheduled_posts: {
        Row: {
          caption: string
          created_at: string | null
          error_message: string | null
          hashtags: string[] | null
          id: string
          instagram_connection_id: string | null
          instagram_media_id: string | null
          instagram_permalink: string | null
          location_id: string | null
          location_name: string | null
          media_type: string | null
          media_urls: string[]
          published_at: string | null
          retry_count: number | null
          scheduled_for: string
          status: string | null
          timezone: string | null
          user_id: string | null
        }
        Insert: {
          caption: string
          created_at?: string | null
          error_message?: string | null
          hashtags?: string[] | null
          id?: string
          instagram_connection_id?: string | null
          instagram_media_id?: string | null
          instagram_permalink?: string | null
          location_id?: string | null
          location_name?: string | null
          media_type?: string | null
          media_urls: string[]
          published_at?: string | null
          retry_count?: number | null
          scheduled_for: string
          status?: string | null
          timezone?: string | null
          user_id?: string | null
        }
        Update: {
          caption?: string
          created_at?: string | null
          error_message?: string | null
          hashtags?: string[] | null
          id?: string
          instagram_connection_id?: string | null
          instagram_media_id?: string | null
          instagram_permalink?: string | null
          location_id?: string | null
          location_name?: string | null
          media_type?: string | null
          media_urls?: string[]
          published_at?: string | null
          retry_count?: number | null
          scheduled_for?: string
          status?: string | null
          timezone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'instagram_scheduled_posts_instagram_connection_id_fkey'
            columns: ['instagram_connection_id']
            isOneToOne: false
            referencedRelation: 'instagram_connections'
            referencedColumns: ['id']
          },
        ]
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
            foreignKeyName: 'invoices_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_interactions: {
        Row: {
          attachments: string[] | null
          content: string | null
          created_at: string | null
          created_by: string | null
          duration_minutes: number | null
          id: string
          lead_id: string | null
          subject: string | null
          type: string
        }
        Insert: {
          attachments?: string[] | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          subject?: string | null
          type: string
        }
        Update: {
          attachments?: string[] | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          subject?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lead_interactions_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      lead_stage_history: {
        Row: {
          duration_minutes: number | null
          from_stage_id: string | null
          id: string
          lead_id: string | null
          moved_at: string | null
          moved_by: string | null
          notes: string | null
          to_stage_id: string | null
        }
        Insert: {
          duration_minutes?: number | null
          from_stage_id?: string | null
          id?: string
          lead_id?: string | null
          moved_at?: string | null
          moved_by?: string | null
          notes?: string | null
          to_stage_id?: string | null
        }
        Update: {
          duration_minutes?: number | null
          from_stage_id?: string | null
          id?: string
          lead_id?: string | null
          moved_at?: string | null
          moved_by?: string | null
          notes?: string | null
          to_stage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'lead_stage_history_from_stage_id_fkey'
            columns: ['from_stage_id']
            isOneToOne: false
            referencedRelation: 'pipeline_stages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_stage_history_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_stage_history_to_stage_id_fkey'
            columns: ['to_stage_id']
            isOneToOne: false
            referencedRelation: 'pipeline_stages'
            referencedColumns: ['id']
          },
        ]
      }
      lead_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          is_completed: boolean | null
          lead_id: string | null
          priority: string | null
          reminder_minutes_before: number | null
          reminder_sent: boolean | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          is_completed?: boolean | null
          lead_id?: string | null
          priority?: string | null
          reminder_minutes_before?: number | null
          reminder_sent?: boolean | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          is_completed?: boolean | null
          lead_id?: string | null
          priority?: string | null
          reminder_minutes_before?: number | null
          reminder_sent?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lead_tasks_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          client_name: string
          converted_at: string | null
          converted_to_client_id: string | null
          converted_to_project_id: string | null
          created_at: string | null
          current_stage_id: string | null
          custom_fields: Json | null
          email: string | null
          email_status: string | null
          estimated_budget: number | null
          event_date: string | null
          event_location: string | null
          event_type: string | null
          id: string
          lead_score: number | null
          lost_at: string | null
          lost_reason: string | null
          name: string | null
          notes: string | null
          number_of_people: number | null
          phone: string | null
          score_factors: Json | null
          source: string | null
          source_details: string | null
          status: string | null
          user_id: string | null
          value: number | null
          whatsapp: string | null
          won_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_name: string
          converted_at?: string | null
          converted_to_client_id?: string | null
          converted_to_project_id?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          custom_fields?: Json | null
          email?: string | null
          email_status?: string | null
          estimated_budget?: number | null
          event_date?: string | null
          event_location?: string | null
          event_type?: string | null
          id?: string
          lead_score?: number | null
          lost_at?: string | null
          lost_reason?: string | null
          name?: string | null
          notes?: string | null
          number_of_people?: number | null
          phone?: string | null
          score_factors?: Json | null
          source?: string | null
          source_details?: string | null
          status?: string | null
          user_id?: string | null
          value?: number | null
          whatsapp?: string | null
          won_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_name?: string
          converted_at?: string | null
          converted_to_client_id?: string | null
          converted_to_project_id?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          custom_fields?: Json | null
          email?: string | null
          email_status?: string | null
          estimated_budget?: number | null
          event_date?: string | null
          event_location?: string | null
          event_type?: string | null
          id?: string
          lead_score?: number | null
          lost_at?: string | null
          lost_reason?: string | null
          name?: string | null
          notes?: string | null
          number_of_people?: number | null
          phone?: string | null
          score_factors?: Json | null
          source?: string | null
          source_details?: string | null
          status?: string | null
          user_id?: string | null
          value?: number | null
          whatsapp?: string | null
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'leads_converted_to_client_id_fkey'
            columns: ['converted_to_client_id']
            isOneToOne: false
            referencedRelation: 'wedding_clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_converted_to_project_id_fkey'
            columns: ['converted_to_project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_current_stage_id_fkey'
            columns: ['current_stage_id']
            isOneToOne: false
            referencedRelation: 'pipeline_stages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      makeup_artists: {
        Row: {
          address: string | null
          business_name: string
          cpf: string | null
          created_at: string | null
          id: string
          monthly_price: number | null
          phone: string | null
          plan_expires_at: string | null
          plan_started_at: string | null
          plan_status: string | null
          plan_type: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          business_name: string
          cpf?: string | null
          created_at?: string | null
          id?: string
          monthly_price?: number | null
          phone?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string | null
          plan_status?: string | null
          plan_type?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          business_name?: string
          cpf?: string | null
          created_at?: string | null
          id?: string
          monthly_price?: number | null
          phone?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string | null
          plan_status?: string | null
          plan_type?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
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
            foreignKeyName: 'moodboard_images_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      notification_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          notification_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'notification_logs_notification_id_fkey'
            columns: ['notification_id']
            isOneToOne: false
            referencedRelation: 'assistant_notifications'
            referencedColumns: ['id']
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
      pipeline_custom_fields: {
        Row: {
          created_at: string | null
          display_order: number | null
          field_name: string
          field_options: string[] | null
          field_type: string
          id: string
          is_required: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          field_name: string
          field_options?: string[] | null
          field_type: string
          id?: string
          is_required?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          field_name?: string
          field_options?: string[] | null
          field_type?: string
          id?: string
          is_required?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          automation_rules: Json | null
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          is_default: boolean | null
          name: string
          stage_type: string | null
          user_id: string | null
        }
        Insert: {
          automation_rules?: Json | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order: number
          id?: string
          is_default?: boolean | null
          name: string
          stage_type?: string | null
          user_id?: string | null
        }
        Update: {
          automation_rules?: Json | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_default?: boolean | null
          name?: string
          stage_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      plan_limits: {
        Row: {
          created_at: string | null
          features: Json
          max_clients: number | null
          max_projects_per_month: number | null
          max_team_members: number | null
          plan_type: string
        }
        Insert: {
          created_at?: string | null
          features: Json
          max_clients?: number | null
          max_projects_per_month?: number | null
          max_team_members?: number | null
          plan_type: string
        }
        Update: {
          created_at?: string | null
          features?: Json
          max_clients?: number | null
          max_projects_per_month?: number | null
          max_team_members?: number | null
          plan_type?: string
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
          contract_url: string | null
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
          logo_url: string | null
          name: string | null
          onboarding_completed: boolean | null
          parent_user_id: string | null
          phone: string | null
          plan: string | null
          'profiles.role': string | null
          role: string | null
          slug: string | null
          state: string | null
          stripe_customer_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          total_clients: number | null
          "updated_at'": string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          business_name?: string | null
          city?: string | null
          contract_url?: string | null
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
          logo_url?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          parent_user_id?: string | null
          phone?: string | null
          plan?: string | null
          'profiles.role'?: string | null
          role?: string | null
          slug?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_clients?: number | null
          "updated_at'"?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          business_name?: string | null
          city?: string | null
          contract_url?: string | null
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
          logo_url?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          parent_user_id?: string | null
          phone?: string | null
          plan?: string | null
          'profiles.role'?: string | null
          role?: string | null
          slug?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_clients?: number | null
          "updated_at'"?: string | null
          website?: string | null
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
            foreignKeyName: 'project_services_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_services_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          client_cpf: string | null
          client_id: string | null
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
          client_cpf?: string | null
          client_id?: string | null
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
          client_cpf?: string | null
          client_id?: string | null
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
            foreignKeyName: 'wedding_clients'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'wedding_clients'
            referencedColumns: ['id']
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
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
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
          price_monthly?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
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
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sync_conflicts: {
        Row: {
          conflict_type: string
          created_at: string | null
          event_id: string | null
          google_version: Json
          id: string
          khaos_version: Json
          resolution: string | null
          resolved: boolean | null
          resolved_at: string | null
        }
        Insert: {
          conflict_type: string
          created_at?: string | null
          event_id?: string | null
          google_version: Json
          id?: string
          khaos_version: Json
          resolution?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
        }
        Update: {
          conflict_type?: string
          created_at?: string | null
          event_id?: string | null
          google_version?: Json
          id?: string
          khaos_version?: Json
          resolution?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'sync_conflicts_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'calendar_events'
            referencedColumns: ['id']
          },
        ]
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
            foreignKeyName: 'sync_log_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'calendar_events'
            referencedColumns: ['id']
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
            foreignKeyName: 'tasks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
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
            foreignKeyName: 'team_members_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_members_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
          type?: string | null
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_assistant_id_fkey'
            columns: ['assistant_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_assistant_id_fkey'
            columns: ['assistant_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_wallet_id_fkey'
            columns: ['wallet_id']
            isOneToOne: false
            referencedRelation: 'wallets'
            referencedColumns: ['id']
          },
        ]
      }
      user_achievements: {
        Row: {
          badge_id: string | null
          id: string
          is_new: boolean | null
          seen_at: string | null
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          badge_id?: string | null
          id?: string
          is_new?: boolean | null
          seen_at?: string | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          badge_id?: string | null
          id?: string
          is_new?: boolean | null
          seen_at?: string | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_achievements_badge_id_fkey'
            columns: ['badge_id']
            isOneToOne: false
            referencedRelation: 'achievements'
            referencedColumns: ['badge_id']
          },
        ]
      }
      user_ai_settings: {
        Row: {
          api_key: string | null
          created_at: string | null
          id: string
          model_name: string | null
          provider: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string | null
          id?: string
          model_name?: string | null
          provider?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string | null
          id?: string
          model_name?: string | null
          provider?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      user_onboarding: {
        Row: {
          business_info_completed: boolean | null
          calendar_synced: boolean | null
          completed_at: string | null
          completed_steps: string[] | null
          created_at: string | null
          current_step: string | null
          first_client_added: boolean | null
          first_contract_generated: boolean | null
          first_event_created: boolean | null
          has_seen_tour: boolean | null
          id: string
          is_completed: boolean | null
          profile_customized: boolean | null
          started_at: string | null
          tour_step: number | null
          unlocked_badges: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          business_info_completed?: boolean | null
          calendar_synced?: boolean | null
          completed_at?: string | null
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: string | null
          first_client_added?: boolean | null
          first_contract_generated?: boolean | null
          first_event_created?: boolean | null
          has_seen_tour?: boolean | null
          id?: string
          is_completed?: boolean | null
          profile_customized?: boolean | null
          started_at?: string | null
          tour_step?: number | null
          unlocked_badges?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          business_info_completed?: boolean | null
          calendar_synced?: boolean | null
          completed_at?: string | null
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: string | null
          first_client_added?: boolean | null
          first_contract_generated?: boolean | null
          first_event_created?: boolean | null
          has_seen_tour?: boolean | null
          id?: string
          is_completed?: boolean | null
          profile_customized?: boolean | null
          started_at?: string | null
          tour_step?: number | null
          unlocked_badges?: string[] | null
          updated_at?: string | null
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
      user_seen_tips: {
        Row: {
          id: string
          seen_at: string | null
          tip_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          seen_at?: string | null
          tip_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          seen_at?: string | null
          tip_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_seen_tips_tip_id_fkey'
            columns: ['tip_id']
            isOneToOne: false
            referencedRelation: 'contextual_tips'
            referencedColumns: ['id']
          },
        ]
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
          contract_url: string | null
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
          contract_url?: string | null
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
          contract_url?: string | null
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
          contract_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          name: string | null
          phone: string | null
        }
        Insert: {
          birth_date?: string | null
          contract_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          name?: never
          phone?: string | null
        }
        Update: {
          birth_date?: string | null
          contract_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          name?: never
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
      calculate_engagement_rate: {
        Args: {
          p_comments: number
          p_followers: number
          p_likes: number
          p_saves: number
        }
        Returns: number
      }
      check_and_unlock_achievements: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      check_assistant_exists: { Args: { p_email: string }; Returns: Json }
      check_plan_limit: {
        Args: { p_count?: number; p_feature: string; p_user_id: string }
        Returns: Json
      }
      create_assistant_invite: {
        Args: { p_assistant_email: string; p_makeup_artist_id: string }
        Returns: Json
      }
      create_default_pipeline_stages: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      enable_auditing: {
        Args: { table_name_input: string }
        Returns: undefined
      }
      execute_stage_automations: {
        Args: { p_lead_id: string; p_stage_id: string }
        Returns: undefined
      }
      generate_signature_hash: {
        Args: {
          p_contract_id: string
          p_device_fingerprint: string
          p_ip_address: string
          p_signature_data: string
          p_signer_cpf: string
          p_signer_email: string
          p_signer_name: string
          p_timestamp: string
        }
        Returns: string
      }
      get_bride_dashboard_data:
        | { Args: { p_client_id: string }; Returns: Json }
        | { Args: { p_client_id: string; p_pin: string }; Returns: Json }
      get_required_plan: { Args: { p_feature: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      match_knowledge: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
          title: string
        }[]
      }
      refresh_instagram_token: {
        Args: { p_connection_id: string }
        Returns: undefined
      }
      send_templated_email: {
        Args: {
          recipient: string
          template_data: Json
          template_name: string
          user_id?: string
        }
        Returns: undefined
      }
      validate_bride_pin: {
        Args: { client_id: string; pin_code: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: 'admin' | 'editor' | 'viewer'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ['admin', 'editor', 'viewer'],
    },
  },
} as const
