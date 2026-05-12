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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          movie_id: string | null
          percent: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          movie_id?: string | null
          percent: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          movie_id?: string | null
          percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          created_at: string
          description: string
          duration: string | null
          episode_number: number
          id: string
          season_id: string
          thumbnail_url: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          duration?: string | null
          episode_number: number
          id?: string
          season_id: string
          thumbnail_url?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          duration?: string | null
          episode_number?: number
          id?: string
          season_id?: string
          thumbnail_url?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      movies: {
        Row: {
          backdrop_url: string | null
          created_at: string
          description: string
          duration: string | null
          featured: boolean
          genre: string[]
          id: string
          poster_url: string | null
          price: number
          rating: string | null
          teaser_url: string | null
          title: string
          type: string
          video_url: string | null
          year: number | null
        }
        Insert: {
          backdrop_url?: string | null
          created_at?: string
          description?: string
          duration?: string | null
          featured?: boolean
          genre?: string[]
          id?: string
          poster_url?: string | null
          price?: number
          rating?: string | null
          teaser_url?: string | null
          title: string
          type?: string
          video_url?: string | null
          year?: number | null
        }
        Update: {
          backdrop_url?: string | null
          created_at?: string
          description?: string
          duration?: string | null
          featured?: boolean
          genre?: string[]
          id?: string
          poster_url?: string | null
          price?: number
          rating?: string | null
          teaser_url?: string | null
          title?: string
          type?: string
          video_url?: string | null
          year?: number | null
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          esewa_number: string
          esewa_qr_url: string | null
          id: string
          khalti_number: string
          khalti_qr_url: string | null
          terms: string
          updated_at: string
        }
        Insert: {
          esewa_number?: string
          esewa_qr_url?: string | null
          id?: string
          khalti_number?: string
          khalti_qr_url?: string | null
          terms?: string
          updated_at?: string
        }
        Update: {
          esewa_number?: string
          esewa_qr_url?: string | null
          id?: string
          khalti_number?: string
          khalti_qr_url?: string | null
          terms?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          clerk_user_id: string
          coupon_code: string | null
          device_id: string
          device_label: string | null
          email: string
          expected_price: number | null
          id: string
          method: string | null
          movie_id: string
          price_paid: number
          purchased_at: string
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title_type: string
          tx_id: string | null
        }
        Insert: {
          clerk_user_id: string
          coupon_code?: string | null
          device_id: string
          device_label?: string | null
          email: string
          expected_price?: number | null
          id?: string
          method?: string | null
          movie_id: string
          price_paid: number
          purchased_at?: string
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title_type?: string
          tx_id?: string | null
        }
        Update: {
          clerk_user_id?: string
          coupon_code?: string | null
          device_id?: string
          device_label?: string | null
          email?: string
          expected_price?: number | null
          id?: string
          method?: string | null
          movie_id?: string
          price_paid?: number
          purchased_at?: string
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title_type?: string
          tx_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          id: string
          season_number: number
          series_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          season_number: number
          series_id: string
          title?: string
        }
        Update: {
          created_at?: string
          id?: string
          season_number?: number
          series_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          backdrop_url: string | null
          created_at: string
          description: string
          featured: boolean
          genre: string[]
          id: string
          poster_url: string | null
          price: number
          rating: string | null
          teaser_url: string | null
          title: string
          year: number | null
        }
        Insert: {
          backdrop_url?: string | null
          created_at?: string
          description?: string
          featured?: boolean
          genre?: string[]
          id?: string
          poster_url?: string | null
          price?: number
          rating?: string | null
          teaser_url?: string | null
          title: string
          year?: number | null
        }
        Update: {
          backdrop_url?: string | null
          created_at?: string
          description?: string
          featured?: boolean
          genre?: string[]
          id?: string
          poster_url?: string | null
          price?: number
          rating?: string | null
          teaser_url?: string | null
          title?: string
          year?: number | null
        }
        Relationships: []
      }
      sub_admin_titles: {
        Row: {
          created_at: string
          id: string
          sub_admin_email: string
          title_id: string
          title_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          sub_admin_email: string
          title_id: string
          title_type: string
        }
        Update: {
          created_at?: string
          id?: string
          sub_admin_email?: string
          title_id?: string
          title_type?: string
        }
        Relationships: []
      }
      sub_admins: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          body: string
          clerk_user_id: string
          created_at: string
          email: string
          id: string
          sender: string
        }
        Insert: {
          body: string
          clerk_user_id: string
          created_at?: string
          email: string
          id?: string
          sender: string
        }
        Update: {
          body?: string
          clerk_user_id?: string
          created_at?: string
          email?: string
          id?: string
          sender?: string
        }
        Relationships: []
      }
      teaser_views: {
        Row: {
          clerk_user_id: string | null
          id: number
          movie_id: string
          viewed_at: string
        }
        Insert: {
          clerk_user_id?: string | null
          id?: number
          movie_id: string
          viewed_at?: string
        }
        Update: {
          clerk_user_id?: string | null
          id?: number
          movie_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teaser_views_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
