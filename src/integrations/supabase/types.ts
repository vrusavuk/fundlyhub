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
      categories: {
        Row: {
          color_class: string
          created_at: string
          description: string | null
          display_order: number | null
          emoji: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color_class: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          emoji: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color_class?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
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
      fundraisers: {
        Row: {
          beneficiary_contact: string | null
          beneficiary_name: string | null
          category: string | null
          category_id: string | null
          cover_image: string | null
          created_at: string | null
          currency: string | null
          end_date: string | null
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
          category?: string | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
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
          category?: string | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
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
            foreignKeyName: "fundraisers_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "org_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: Json | null
          categories: string[] | null
          country: string | null
          created_at: string | null
          dba_name: string | null
          ein: string | null
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
          ein?: string | null
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
          ein?: string | null
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
      profiles: {
        Row: {
          avatar: string | null
          bio: string | null
          campaign_count: number | null
          created_at: string | null
          email: string | null
          follower_count: number | null
          following_count: number | null
          id: string
          location: string | null
          name: string | null
          profile_visibility: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          social_links: Json | null
          total_funds_raised: number | null
          twofa_enabled: boolean | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          campaign_count?: number | null
          created_at?: string | null
          email?: string | null
          follower_count?: number | null
          following_count?: number | null
          id: string
          location?: string | null
          name?: string | null
          profile_visibility?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_links?: Json | null
          total_funds_raised?: number | null
          twofa_enabled?: boolean | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          campaign_count?: number | null
          created_at?: string | null
          email?: string | null
          follower_count?: number | null
          following_count?: number | null
          id?: string
          location?: string | null
          name?: string | null
          profile_visibility?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_links?: Json | null
          total_funds_raised?: number | null
          twofa_enabled?: boolean | null
          updated_at?: string | null
          website?: string | null
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
            foreignKeyName: "updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
    }
    Views: {
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
    }
    Functions: {
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
