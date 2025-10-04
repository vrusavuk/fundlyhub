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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      campaign_analytics_projection: {
        Row: {
          average_donation: number | null
          campaign_id: string
          donation_count: number | null
          first_donation_at: string | null
          last_donation_at: string | null
          total_donations: number | null
          unique_donors: number | null
          updated_at: string | null
        }
        Insert: {
          average_donation?: number | null
          campaign_id: string
          donation_count?: number | null
          first_donation_at?: string | null
          last_donation_at?: string | null
          total_donations?: number | null
          unique_donors?: number | null
          updated_at?: string | null
        }
        Update: {
          average_donation?: number | null
          campaign_id?: string
          donation_count?: number | null
          first_donation_at?: string | null
          last_donation_at?: string | null
          total_donations?: number | null
          unique_donors?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      campaign_search_projection: {
        Row: {
          beneficiary_name: string | null
          campaign_id: string
          category_name: string | null
          created_at: string
          location: string | null
          org_name: string | null
          owner_name: string | null
          search_vector: unknown | null
          status: Database["public"]["Enums"]["fundraiser_status"]
          story_text: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Insert: {
          beneficiary_name?: string | null
          campaign_id: string
          category_name?: string | null
          created_at: string
          location?: string | null
          org_name?: string | null
          owner_name?: string | null
          search_vector?: unknown | null
          status: Database["public"]["Enums"]["fundraiser_status"]
          story_text?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Update: {
          beneficiary_name?: string | null
          campaign_id?: string
          category_name?: string | null
          created_at?: string
          location?: string | null
          org_name?: string | null
          owner_name?: string | null
          search_vector?: unknown | null
          status?: Database["public"]["Enums"]["fundraiser_status"]
          story_text?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Relationships: [
          {
            foreignKeyName: "campaign_search_projection_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_search_projection_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "public_fundraiser_stats"
            referencedColumns: ["fundraiser_id"]
          },
        ]
      }
      campaign_stats_projection: {
        Row: {
          average_donation: number | null
          campaign_id: string
          comment_count: number | null
          donation_count: number | null
          first_donation_at: string | null
          last_donation_at: string | null
          peak_donation_amount: number | null
          share_count: number | null
          total_donations: number | null
          unique_donors: number | null
          update_count: number | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          average_donation?: number | null
          campaign_id: string
          comment_count?: number | null
          donation_count?: number | null
          first_donation_at?: string | null
          last_donation_at?: string | null
          peak_donation_amount?: number | null
          share_count?: number | null
          total_donations?: number | null
          unique_donors?: number | null
          update_count?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          average_donation?: number | null
          campaign_id?: string
          comment_count?: number | null
          donation_count?: number | null
          first_donation_at?: string | null
          last_donation_at?: string | null
          peak_donation_amount?: number | null
          share_count?: number | null
          total_donations?: number | null
          unique_donors?: number | null
          update_count?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_stats_projection_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_stats_projection_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "public_fundraiser_stats"
            referencedColumns: ["fundraiser_id"]
          },
        ]
      }
      campaign_summary_projection: {
        Row: {
          campaign_id: string
          category_id: string | null
          cover_image: string | null
          created_at: string
          days_remaining: number | null
          donor_count: number | null
          end_date: string | null
          goal_amount: number
          last_donation_at: string | null
          org_id: string | null
          org_name: string | null
          owner_avatar: string | null
          owner_name: string | null
          owner_user_id: string
          progress_percentage: number | null
          slug: string
          status: Database["public"]["Enums"]["fundraiser_status"]
          summary: string | null
          title: string
          total_raised: number | null
          updated_at: string | null
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Insert: {
          campaign_id: string
          category_id?: string | null
          cover_image?: string | null
          created_at: string
          days_remaining?: number | null
          donor_count?: number | null
          end_date?: string | null
          goal_amount: number
          last_donation_at?: string | null
          org_id?: string | null
          org_name?: string | null
          owner_avatar?: string | null
          owner_name?: string | null
          owner_user_id: string
          progress_percentage?: number | null
          slug: string
          status: Database["public"]["Enums"]["fundraiser_status"]
          summary?: string | null
          title: string
          total_raised?: number | null
          updated_at?: string | null
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Update: {
          campaign_id?: string
          category_id?: string | null
          cover_image?: string | null
          created_at?: string
          days_remaining?: number | null
          donor_count?: number | null
          end_date?: string | null
          goal_amount?: number
          last_donation_at?: string | null
          org_id?: string | null
          org_name?: string | null
          owner_avatar?: string | null
          owner_name?: string | null
          owner_user_id?: string
          progress_percentage?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["fundraiser_status"]
          summary?: string | null
          title?: string
          total_raised?: number | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Relationships: [
          {
            foreignKeyName: "campaign_summary_projection_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_summary_projection_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "public_fundraiser_stats"
            referencedColumns: ["fundraiser_id"]
          },
          {
            foreignKeyName: "campaign_summary_projection_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_summary_projection_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_summary_projection_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color_class: string
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          emoji: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color_class: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          emoji: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color_class?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          fundraiser_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          fundraiser_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          fundraiser_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "public_fundraiser_stats"
            referencedColumns: ["fundraiser_id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          donor_user_id: string | null
          fee_amount: number | null
          fundraiser_id: string
          id: string
          is_anonymous: boolean
          net_amount: number | null
          payment_provider: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          receipt_id: string | null
          tip_amount: number | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          donor_user_id?: string | null
          fee_amount?: number | null
          fundraiser_id: string
          id?: string
          is_anonymous?: boolean
          net_amount?: number | null
          payment_provider?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          receipt_id?: string | null
          tip_amount?: number | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          donor_user_id?: string | null
          fee_amount?: number | null
          fundraiser_id?: string
          id?: string
          is_anonymous?: boolean
          net_amount?: number | null
          payment_provider?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          receipt_id?: string | null
          tip_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_donor_user_id_fkey"
            columns: ["donor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_donor_user_id_fkey"
            columns: ["donor_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "public_fundraiser_stats"
            referencedColumns: ["fundraiser_id"]
          },
        ]
      }
      donor_history_projection: {
        Row: {
          average_donation: number | null
          campaigns_supported: number | null
          donation_count: number | null
          first_donation_at: string | null
          last_donation_at: string | null
          total_donated: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_donation?: number | null
          campaigns_supported?: number | null
          donation_count?: number | null
          first_donation_at?: string | null
          last_donation_at?: string | null
          total_donated?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_donation?: number | null
          campaigns_supported?: number | null
          donation_count?: number | null
          first_donation_at?: string | null
          last_donation_at?: string | null
          total_donated?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      event_dead_letter_queue: {
        Row: {
          created_at: string | null
          event_data: Json
          failure_count: number | null
          failure_reason: string
          first_failed_at: string | null
          id: string
          last_failed_at: string | null
          original_event_id: string
          processor_name: string
        }
        Insert: {
          created_at?: string | null
          event_data: Json
          failure_count?: number | null
          failure_reason: string
          first_failed_at?: string | null
          id?: string
          last_failed_at?: string | null
          original_event_id: string
          processor_name: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json
          failure_count?: number | null
          failure_reason?: string
          first_failed_at?: string | null
          id?: string
          last_failed_at?: string | null
          original_event_id?: string
          processor_name?: string
        }
        Relationships: []
      }
      event_processing_status: {
        Row: {
          attempt_count: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          event_id: string
          id: string
          last_attempt_at: string | null
          processor_name: string
          status: string
        }
        Insert: {
          attempt_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          event_id: string
          id?: string
          last_attempt_at?: string | null
          processor_name: string
          status: string
        }
        Update: {
          attempt_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          event_id?: string
          id?: string
          last_attempt_at?: string | null
          processor_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_processing_status_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_store"
            referencedColumns: ["event_id"]
          },
        ]
      }
      event_store: {
        Row: {
          aggregate_id: string | null
          causation_id: string | null
          correlation_id: string | null
          created_at: string
          event_data: Json
          event_id: string
          event_type: string
          event_version: string
          id: string
          metadata: Json | null
          occurred_at: string
        }
        Insert: {
          aggregate_id?: string | null
          causation_id?: string | null
          correlation_id?: string | null
          created_at?: string
          event_data: Json
          event_id: string
          event_type: string
          event_version?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
        }
        Update: {
          aggregate_id?: string | null
          causation_id?: string | null
          correlation_id?: string | null
          created_at?: string
          event_data?: Json
          event_id?: string
          event_type?: string
          event_version?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
        }
        Relationships: []
      }
      fundraisers: {
        Row: {
          beneficiary_contact: string | null
          beneficiary_name: string | null
          category_id: string | null
          cover_image: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          deleted_by: string | null
          end_date: string | null
          fts: unknown | null
          goal_amount: number
          id: string
          images: string[] | null
          location: string | null
          org_id: string | null
          owner_user_id: string
          slug: string
          status: Database["public"]["Enums"]["fundraiser_status"] | null
          story_html: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          video_url: string | null
          visibility: Database["public"]["Enums"]["visibility_type"] | null
        }
        Insert: {
          beneficiary_contact?: string | null
          beneficiary_name?: string | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          end_date?: string | null
          fts?: unknown | null
          goal_amount: number
          id?: string
          images?: string[] | null
          location?: string | null
          org_id?: string | null
          owner_user_id: string
          slug: string
          status?: Database["public"]["Enums"]["fundraiser_status"] | null
          story_html?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
        }
        Update: {
          beneficiary_contact?: string | null
          beneficiary_name?: string | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          end_date?: string | null
          fts?: unknown | null
          goal_amount?: number
          id?: string
          images?: string[] | null
          location?: string | null
          org_id?: string | null
          owner_user_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["fundraiser_status"] | null
          story_html?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          visibility?: Database["public"]["Enums"]["visibility_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fundraisers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundraisers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundraisers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundraisers_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundraisers_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          campaign_updates: boolean | null
          created_at: string
          donation_alerts: boolean | null
          email_notifications: boolean | null
          id: string
          new_follower: boolean | null
          push_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_updates?: boolean | null
          created_at?: string
          donation_alerts?: boolean | null
          email_notifications?: boolean | null
          id?: string
          new_follower?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_updates?: boolean | null
          created_at?: string
          donation_alerts?: boolean | null
          email_notifications?: boolean | null
          id?: string
          new_follower?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      org_members: {
        Row: {
          created_at: string | null
          org_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          org_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_search_projection: {
        Row: {
          categories: string[] | null
          country: string | null
          created_at: string
          dba_name: string | null
          legal_name: string
          name_lowercase: string
          name_tokens: string[] | null
          org_id: string
          relevance_boost: number | null
          search_vector: unknown | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website: string | null
        }
        Insert: {
          categories?: string[] | null
          country?: string | null
          created_at: string
          dba_name?: string | null
          legal_name: string
          name_lowercase: string
          name_tokens?: string[] | null
          org_id: string
          relevance_boost?: number | null
          search_vector?: unknown | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website?: string | null
        }
        Update: {
          categories?: string[] | null
          country?: string | null
          created_at?: string
          dba_name?: string | null
          legal_name?: string
          name_lowercase?: string
          name_tokens?: string[] | null
          org_id?: string
          relevance_boost?: number | null
          search_vector?: unknown | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: Json | null
          categories: string[] | null
          country: string | null
          created_at: string | null
          dba_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          ein: string | null
          fts: unknown | null
          id: string
          legal_name: string
          paypal_merchant_id: string | null
          stripe_connect_id: string | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website: string | null
        }
        Insert: {
          address?: Json | null
          categories?: string[] | null
          country?: string | null
          created_at?: string | null
          dba_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          ein?: string | null
          fts?: unknown | null
          id?: string
          legal_name: string
          paypal_merchant_id?: string | null
          stripe_connect_id?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website?: string | null
        }
        Update: {
          address?: Json | null
          categories?: string[] | null
          country?: string | null
          created_at?: string | null
          dba_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          ein?: string | null
          fts?: unknown | null
          id?: string
          legal_name?: string
          paypal_merchant_id?: string | null
          stripe_connect_id?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_locked_until: string | null
          account_status: string | null
          avatar: string | null
          ban_reason: string | null
          banned_at: string | null
          bio: string | null
          campaign_count: number | null
          created_at: string | null
          deleted_at: string | null
          deletion_reason: string | null
          email: string | null
          failed_login_attempts: number | null
          follower_count: number | null
          following_count: number | null
          fts: unknown | null
          id: string
          is_verified: boolean | null
          last_login_at: string | null
          location: string | null
          name: string | null
          profile_visibility: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          social_links: Json | null
          suspended_until: string | null
          suspension_reason: string | null
          total_funds_raised: number | null
          twofa_enabled: boolean | null
          updated_at: string | null
          verified_at: string | null
          website: string | null
        }
        Insert: {
          account_locked_until?: string | null
          account_status?: string | null
          avatar?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          campaign_count?: number | null
          created_at?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          email?: string | null
          failed_login_attempts?: number | null
          follower_count?: number | null
          following_count?: number | null
          fts?: unknown | null
          id: string
          is_verified?: boolean | null
          last_login_at?: string | null
          location?: string | null
          name?: string | null
          profile_visibility?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_links?: Json | null
          suspended_until?: string | null
          suspension_reason?: string | null
          total_funds_raised?: number | null
          twofa_enabled?: boolean | null
          updated_at?: string | null
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          account_locked_until?: string | null
          account_status?: string | null
          avatar?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          campaign_count?: number | null
          created_at?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          email?: string | null
          failed_login_attempts?: number | null
          follower_count?: number | null
          following_count?: number | null
          fts?: unknown | null
          id?: string
          is_verified?: boolean | null
          last_login_at?: string | null
          location?: string | null
          name?: string | null
          profile_visibility?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_links?: Json | null
          suspended_until?: string | null
          suspension_reason?: string | null
          total_funds_raised?: number | null
          twofa_enabled?: boolean | null
          updated_at?: string | null
          verified_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string | null
          role_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          hierarchy_level: number | null
          id: string
          is_system_role: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          hierarchy_level?: number | null
          id?: string
          is_system_role?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          hierarchy_level?: number | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      saga_instances: {
        Row: {
          aggregate_id: string
          completed_at: string | null
          created_at: string
          current_step: number
          data: Json
          error_message: string | null
          id: string
          saga_type: string
          status: string
          updated_at: string
        }
        Insert: {
          aggregate_id: string
          completed_at?: string | null
          created_at?: string
          current_step?: number
          data?: Json
          error_message?: string | null
          id?: string
          saga_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          aggregate_id?: string
          completed_at?: string | null
          created_at?: string
          current_step?: number
          data?: Json
          error_message?: string | null
          id?: string
          saga_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      saga_steps: {
        Row: {
          attempt_count: number
          compensated_at: string | null
          created_at: string
          error_message: string | null
          executed_at: string | null
          id: string
          saga_id: string
          status: string
          step_name: string
          step_number: number
        }
        Insert: {
          attempt_count?: number
          compensated_at?: string | null
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          saga_id: string
          status?: string
          step_name: string
          step_number: number
        }
        Update: {
          attempt_count?: number
          compensated_at?: string | null
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          saga_id?: string
          status?: string
          step_name?: string
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "saga_steps_saga_id_fkey"
            columns: ["saga_id"]
            isOneToOne: false
            referencedRelation: "saga_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      search_results_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          hit_count: number | null
          query: string
          result_count: number
          results: Json
          suggestions: Json | null
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at?: string
          hit_count?: number | null
          query: string
          result_count: number
          results: Json
          suggestions?: Json | null
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          hit_count?: number | null
          query?: string
          result_count?: number
          results?: Json
          suggestions?: Json | null
        }
        Relationships: []
      }
      search_suggestions_projection: {
        Row: {
          created_at: string
          id: string
          match_type: string
          query: string
          relevance_score: number
          success_rate: number | null
          suggestion: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          match_type: string
          query: string
          relevance_score?: number
          success_rate?: number | null
          suggestion: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          match_type?: string
          query?: string
          relevance_score?: number
          success_rate?: number | null
          suggestion?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          request_method: string | null
          request_path: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          request_method?: string | null
          request_path?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          request_method?: string | null
          request_path?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      settings_audit_log: {
        Row: {
          change_reason: string | null
          changed_by: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_value: Json | null
          old_value: Json | null
          setting_key: string
          user_agent: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_by: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_value?: Json | null
          old_value?: Json | null
          setting_key: string
          user_agent?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_value?: Json | null
          old_value?: Json | null
          setting_key?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          following_type: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          following_type: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          following_type?: string
          id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_sensitive: boolean
          requires_restart: boolean
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean
          requires_restart?: boolean
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean
          requires_restart?: boolean
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      updates: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          fundraiser_id: string
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          fundraiser_id: string
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          fundraiser_id?: string
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_updates_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_updates_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_updates_fundraiser"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_updates_fundraiser"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "public_fundraiser_stats"
            referencedColumns: ["fundraiser_id"]
          },
          {
            foreignKeyName: "updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "updates_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "updates_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "public_fundraiser_stats"
            referencedColumns: ["fundraiser_id"]
          },
        ]
      }
      user_activities: {
        Row: {
          activity_type: string
          actor_id: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          activity_type: string
          actor_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          activity_type?: string
          actor_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      user_admin_notes: {
        Row: {
          admin_id: string
          content: string
          created_at: string
          id: string
          is_internal: boolean
          note_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id: string
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          note_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          note_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          read_at: string | null
          sender_id: string | null
          sender_type: string
          subject: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          read_at?: string | null
          sender_id?: string | null
          sender_type?: string
          subject: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          read_at?: string | null
          sender_id?: string | null
          sender_type?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          auto_save: boolean | null
          created_at: string | null
          default_category: string | null
          email_notifications: boolean | null
          font_size: string | null
          has_completed_onboarding: boolean | null
          has_skipped_onboarding: boolean | null
          high_contrast: boolean | null
          id: string
          last_visited: string | null
          push_notifications: boolean | null
          recent_searches: string[] | null
          reduced_motion: boolean | null
          search_suggestions: boolean | null
          theme: string
          updated_at: string | null
          user_id: string
          view_mode: string
        }
        Insert: {
          auto_save?: boolean | null
          created_at?: string | null
          default_category?: string | null
          email_notifications?: boolean | null
          font_size?: string | null
          has_completed_onboarding?: boolean | null
          has_skipped_onboarding?: boolean | null
          high_contrast?: boolean | null
          id?: string
          last_visited?: string | null
          push_notifications?: boolean | null
          recent_searches?: string[] | null
          reduced_motion?: boolean | null
          search_suggestions?: boolean | null
          theme?: string
          updated_at?: string | null
          user_id: string
          view_mode?: string
        }
        Update: {
          auto_save?: boolean | null
          created_at?: string | null
          default_category?: string | null
          email_notifications?: boolean | null
          font_size?: string | null
          has_completed_onboarding?: boolean | null
          has_skipped_onboarding?: boolean | null
          high_contrast?: boolean | null
          id?: string
          last_visited?: string | null
          push_notifications?: boolean | null
          recent_searches?: string[] | null
          reduced_motion?: boolean | null
          search_suggestions?: boolean | null
          theme?: string
          updated_at?: string | null
          user_id?: string
          view_mode?: string
        }
        Relationships: []
      }
      user_role_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          context_id: string | null
          context_type: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          role_id: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          context_id?: string | null
          context_type?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          context_id?: string | null
          context_type?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_search_projection: {
        Row: {
          account_status: string
          avatar: string | null
          bio: string | null
          campaign_count: number | null
          created_at: string
          email: string | null
          follower_count: number | null
          is_verified: boolean | null
          location: string | null
          name: string
          name_bigrams: string[] | null
          name_dmetaphone: string | null
          name_lowercase: string
          name_metaphone: string | null
          name_soundex: string | null
          name_tokens: string[] | null
          name_trigrams: string[] | null
          profile_visibility: string
          relevance_boost: number | null
          role: Database["public"]["Enums"]["user_role"]
          search_vector: unknown | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status: string
          avatar?: string | null
          bio?: string | null
          campaign_count?: number | null
          created_at?: string
          email?: string | null
          follower_count?: number | null
          is_verified?: boolean | null
          location?: string | null
          name: string
          name_bigrams?: string[] | null
          name_dmetaphone?: string | null
          name_lowercase: string
          name_metaphone?: string | null
          name_soundex?: string | null
          name_tokens?: string[] | null
          name_trigrams?: string[] | null
          profile_visibility: string
          relevance_boost?: number | null
          role: Database["public"]["Enums"]["user_role"]
          search_vector?: unknown | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: string
          avatar?: string | null
          bio?: string | null
          campaign_count?: number | null
          created_at?: string
          email?: string | null
          follower_count?: number | null
          is_verified?: boolean | null
          location?: string | null
          name?: string
          name_bigrams?: string[] | null
          name_dmetaphone?: string | null
          name_lowercase?: string
          name_metaphone?: string | null
          name_soundex?: string | null
          name_tokens?: string[] | null
          name_trigrams?: string[] | null
          profile_visibility?: string
          relevance_boost?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          search_vector?: unknown | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      event_statistics: {
        Row: {
          event_count: number | null
          event_type: string | null
          first_seen: string | null
          hour_bucket: string | null
          last_seen: string | null
        }
        Relationships: []
      }
      public_fundraiser_stats: {
        Row: {
          created_at: string | null
          currency: string | null
          donor_count: number | null
          end_date: string | null
          fundraiser_id: string | null
          goal_amount: number | null
          status: Database["public"]["Enums"]["fundraiser_status"] | null
          title: string | null
          total_raised: number | null
          visibility: Database["public"]["Enums"]["visibility_type"] | null
        }
        Relationships: []
      }
      public_organizations: {
        Row: {
          categories: string[] | null
          country: string | null
          created_at: string | null
          dba_name: string | null
          id: string | null
          legal_name: string | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website: string | null
        }
        Insert: {
          categories?: string[] | null
          country?: string | null
          created_at?: string | null
          dba_name?: string | null
          id?: string | null
          legal_name?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website?: string | null
        }
        Update: {
          categories?: string[] | null
          country?: string | null
          created_at?: string | null
          dba_name?: string | null
          id?: string | null
          legal_name?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar: string | null
          bio: string | null
          campaign_count: number | null
          created_at: string | null
          follower_count: number | null
          following_count: number | null
          fts: unknown | null
          id: string | null
          is_verified: boolean | null
          location: string | null
          name: string | null
          profile_visibility: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          social_links: Json | null
          total_funds_raised: number | null
          verified_at: string | null
          website: string | null
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          campaign_count?: number | null
          created_at?: string | null
          follower_count?: number | null
          following_count?: number | null
          fts?: unknown | null
          id?: string | null
          is_verified?: boolean | null
          location?: string | null
          name?: string | null
          profile_visibility?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_links?: Json | null
          total_funds_raised?: number | null
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          campaign_count?: number | null
          created_at?: string | null
          follower_count?: number | null
          following_count?: number | null
          fts?: unknown | null
          id?: string | null
          is_verified?: boolean | null
          location?: string | null
          name?: string | null
          profile_visibility?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_links?: Json | null
          total_funds_raised?: number | null
          verified_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      public_subscriptions: {
        Row: {
          created_at: string | null
          follower_avatar: string | null
          follower_campaign_count: number | null
          follower_follower_count: number | null
          follower_id: string | null
          follower_name: string | null
          follower_role: Database["public"]["Enums"]["user_role"] | null
          follower_visibility: string | null
          following_id: string | null
          following_org_dba_name: string | null
          following_org_legal_name: string | null
          following_org_verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          following_type: string | null
          following_user_avatar: string | null
          following_user_campaign_count: number | null
          following_user_follower_count: number | null
          following_user_name: string | null
          following_user_role: Database["public"]["Enums"]["user_role"] | null
          following_user_visibility: string | null
          id: string | null
        }
        Relationships: []
      }
      searchable_content: {
        Row: {
          content_type: string | null
          created_at: string | null
          description: string | null
          id: string | null
          search_vector: unknown | null
          status: string | null
          title: string | null
          visibility: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_similarity: {
        Args: { text1: string; text2: string }
        Returns: number
      }
      char_sequence_match: {
        Args: { name_text: string; query_text: string }
        Returns: boolean
      }
      enhanced_fuzzy_search_users: {
        Args: {
          include_suggestions?: boolean
          max_results?: number
          search_query: string
        }
        Returns: {
          avatar: string
          bio: string
          campaign_count: number
          follower_count: number
          is_suggestion: boolean
          match_name: string
          match_type: string
          relevance_score: number
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }[]
      }
      fuzzy_search_users: {
        Args: { search_query: string; similarity_threshold?: number }
        Returns: {
          match_name: string
          match_type: string
          relevance_score: number
          user_id: string
        }[]
      }
      get_campaign_aggregate_stats: {
        Args:
          | {
              category_filter?: string
              search_term?: string
              status_filter?: string
            }
          | {
              category_filter?: string
              search_term?: string
              status_filter?: string
              visibility_filter?: string
            }
        Returns: {
          active_campaigns: number
          closed_campaigns: number
          draft_campaigns: number
          ended_campaigns: number
          paused_campaigns: number
          pending_campaigns: number
          total_campaigns: number
          total_raised: number
        }[]
      }
      get_campaign_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_campaigns: number
          closed_campaigns: number
          total_funds_raised: number
        }[]
      }
      get_category_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_campaigns: number
          campaign_count: number
          category_id: string
          category_name: string
          closed_campaigns: number
          color_class: string
          emoji: string
          total_raised: number
        }[]
      }
      get_fundraiser_totals: {
        Args: { fundraiser_ids: string[] }
        Returns: {
          donor_count: number
          fundraiser_id: string
          total_raised: number
        }[]
      }
      get_my_complete_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          account_locked_until: string | null
          account_status: string | null
          avatar: string | null
          ban_reason: string | null
          banned_at: string | null
          bio: string | null
          campaign_count: number | null
          created_at: string | null
          deleted_at: string | null
          deletion_reason: string | null
          email: string | null
          failed_login_attempts: number | null
          follower_count: number | null
          following_count: number | null
          fts: unknown | null
          id: string
          is_verified: boolean | null
          last_login_at: string | null
          location: string | null
          name: string | null
          profile_visibility: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          social_links: Json | null
          suspended_until: string | null
          suspension_reason: string | null
          total_funds_raised: number | null
          twofa_enabled: boolean | null
          updated_at: string | null
          verified_at: string | null
          website: string | null
        }[]
      }
      get_my_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          permission_category: string
          permission_display_name: string
          permission_name: string
        }[]
      }
      get_organization_profile_stats: {
        Args: { target_org_id: string }
        Returns: {
          campaign_count: number
          follower_count: number
          total_funds_raised: number
        }[]
      }
      get_public_followers: {
        Args: { limit_count?: number; target_user_id: string }
        Returns: {
          avatar: string
          campaign_count: number
          follower_count: number
          id: string
          name: string
          role: string
          type: string
        }[]
      }
      get_public_following: {
        Args: { limit_count?: number; target_user_id: string }
        Returns: {
          avatar: string
          campaign_count: number
          dba_name: string
          follower_count: number
          id: string
          legal_name: string
          name: string
          role: string
          type: string
        }[]
      }
      get_public_fundraiser: {
        Args: { fundraiser_slug: string }
        Returns: {
          beneficiary_name: string
          category_id: string
          cover_image: string
          created_at: string
          currency: string
          end_date: string
          goal_amount: number
          id: string
          images: string[]
          location: string
          org_id: string
          owner_user_id: string
          slug: string
          status: Database["public"]["Enums"]["fundraiser_status"]
          story_html: string
          summary: string
          tags: string[]
          title: string
          updated_at: string
          video_url: string
          visibility: Database["public"]["Enums"]["visibility_type"]
        }[]
      }
      get_public_organization_info: {
        Args: { org_id: string }
        Returns: {
          categories: string[]
          country: string
          created_at: string
          dba_name: string
          id: string
          legal_name: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          website: string
        }[]
      }
      get_public_user_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar: string
          bio: string
          campaign_count: number
          created_at: string
          follower_count: number
          following_count: number
          id: string
          is_verified: boolean
          location: string
          name: string
          profile_visibility: string
          role: Database["public"]["Enums"]["user_role"]
          social_links: Json
          total_funds_raised: number
          verified_at: string
          website: string
        }[]
      }
      get_recent_activities: {
        Args: { limit_count?: number }
        Returns: {
          description: string
          event_timestamp: string
          id: string
          severity: string
          type: string
        }[]
      }
      get_system_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          api: string
          database: string
          last_check: string
          storage: string
        }[]
      }
      get_user_profile_stats: {
        Args: { target_user_id: string }
        Returns: {
          campaign_count: number
          follower_count: number
          following_count: number
          total_funds_raised: number
        }[]
      }
      get_user_roles: {
        Args: { _context_id?: string; _context_type?: string; _user_id: string }
        Returns: {
          context_id: string
          context_type: string
          hierarchy_level: number
          role_name: string
        }[]
      }
      has_existing_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_org_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["org_member_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      levenshtein_distance: {
        Args: { s1: string; s2: string }
        Returns: number
      }
      log_audit_event: {
        Args: {
          _action: string
          _actor_id: string
          _ip_address?: unknown
          _metadata?: Json
          _resource_id?: string
          _resource_type: string
          _user_agent?: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          _details?: Json
          _event_type: string
          _ip_address?: unknown
          _request_method?: string
          _request_path?: string
          _success?: boolean
          _user_agent?: string
          _user_id?: string
        }
        Returns: string
      }
      ngram_similarity_enhanced: {
        Args: { n?: number; text1: string; text2: string }
        Returns: number
      }
      phonetic_match: {
        Args: { text1: string; text2: string }
        Returns: boolean
      }
      refresh_event_statistics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_searchable_content: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      resync_organization_search_projections: {
        Args: Record<PropertyKey, never>
        Returns: {
          synced_count: number
        }[]
      }
      token_match_score: {
        Args: { name_text: string; query_text: string }
        Returns: number
      }
      update_campaign_analytics_safe: {
        Args: { p_amount: number; p_campaign_id: string; p_donor_id: string }
        Returns: undefined
      }
      update_donor_history_safe: {
        Args: { p_amount: number; p_campaign_id: string; p_user_id: string }
        Returns: undefined
      }
      update_follow_counts: {
        Args: {
          affected_org_id?: string
          affected_user_id: string
          operation?: string
        }
        Returns: undefined
      }
      update_user_campaign_count: {
        Args: { user_id: string }
        Returns: undefined
      }
      user_has_permission: {
        Args: {
          _context_id?: string
          _context_type?: string
          _permission_name: string
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      fundraiser_status:
        | "draft"
        | "active"
        | "paused"
        | "ended"
        | "closed"
        | "pending"
      org_member_role: "owner" | "admin" | "editor" | "viewer"
      payment_status: "paid" | "refunded" | "failed"
      user_role: "visitor" | "creator" | "org_admin" | "admin"
      verification_status: "pending" | "approved" | "rejected"
      visibility_type: "public" | "unlisted"
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
      fundraiser_status: [
        "draft",
        "active",
        "paused",
        "ended",
        "closed",
        "pending",
      ],
      org_member_role: ["owner", "admin", "editor", "viewer"],
      payment_status: ["paid", "refunded", "failed"],
      user_role: ["visitor", "creator", "org_admin", "admin"],
      verification_status: ["pending", "approved", "rejected"],
      visibility_type: ["public", "unlisted"],
    },
  },
} as const
