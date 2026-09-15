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
      ai_features: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      ai_request_logs: {
        Row: {
          cost_usd: number | null
          created_at: string
          feature_id: string
          id: string
          input_summary: string | null
          latency_ms: number | null
          model_config_id: string
          output_summary: string | null
          prompt_version_id: string
          raw_output: Json
          status: string
          tokens_used: number | null
          user_feedback: number | null
          user_id: string
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          feature_id: string
          id?: string
          input_summary?: string | null
          latency_ms?: number | null
          model_config_id: string
          output_summary?: string | null
          prompt_version_id: string
          raw_output?: Json
          status: string
          tokens_used?: number | null
          user_feedback?: number | null
          user_id: string
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          feature_id?: string
          id?: string
          input_summary?: string | null
          latency_ms?: number | null
          model_config_id?: string
          output_summary?: string | null
          prompt_version_id?: string
          raw_output?: Json
          status?: string
          tokens_used?: number | null
          user_feedback?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_request_logs_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "ai_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_request_logs_model_config_id_fkey"
            columns: ["model_config_id"]
            isOneToOne: false
            referencedRelation: "model_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_request_logs_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_request_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          last_activity: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_activity?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_balances: {
        Row: {
          balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      face_scans: {
        Row: {
          analysis_notes: string | null
          area_evaluations: Json | null
          created_at: string
          id: string
          overall_score: number
          product_recommendations: Json | null
          raw_ai_response: Json | null
          skin_concerns: string[] | null
          skin_status_title: string | null
          skin_type: string
          user_id: string
        }
        Insert: {
          analysis_notes?: string | null
          area_evaluations?: Json | null
          created_at?: string
          id?: string
          overall_score: number
          product_recommendations?: Json | null
          raw_ai_response?: Json | null
          skin_concerns?: string[] | null
          skin_status_title?: string | null
          skin_type: string
          user_id: string
        }
        Update: {
          analysis_notes?: string | null
          area_evaluations?: Json | null
          created_at?: string
          id?: string
          overall_score?: number
          product_recommendations?: Json | null
          raw_ai_response?: Json | null
          skin_concerns?: string[] | null
          skin_status_title?: string | null
          skin_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "face_scans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          coin_reward: number
          cooldown_hours: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          metadata: Json
          name: string
          slug: string
          target_count: number
          type: string
        }
        Insert: {
          coin_reward: number
          cooldown_hours?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          slug: string
          target_count?: number
          type: string
        }
        Update: {
          coin_reward?: number
          cooldown_hours?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          slug?: string
          target_count?: number
          type?: string
        }
        Relationships: []
      }
      model_configs: {
        Row: {
          api_key_secret: string
          created_at: string
          created_by: string | null
          feature_id: string
          id: string
          is_active: boolean
          model_name: string
          notes: string | null
          parameters: Json
          provider: string
        }
        Insert: {
          api_key_secret: string
          created_at?: string
          created_by?: string | null
          feature_id: string
          id?: string
          is_active?: boolean
          model_name: string
          notes?: string | null
          parameters?: Json
          provider: string
        }
        Update: {
          api_key_secret?: string
          created_at?: string
          created_by?: string | null
          feature_id?: string
          id?: string
          is_active?: boolean
          model_name?: string
          notes?: string | null
          parameters?: Json
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_configs_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "ai_features"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          key_ingredients: string[]
          listing_type: string
          marketplace_url: string | null
          name: string
          price_estimate: string | null
          skin_type_fit: string[]
          sponsor_weight: number
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          key_ingredients?: string[]
          listing_type?: string
          marketplace_url?: string | null
          name: string
          price_estimate?: string | null
          skin_type_fit?: string[]
          sponsor_weight?: number
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          key_ingredients?: string[]
          listing_type?: string
          marketplace_url?: string | null
          name?: string
          price_estimate?: string | null
          skin_type_fit?: string[]
          sponsor_weight?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      prompt_versions: {
        Row: {
          created_at: string
          created_by: string | null
          feature_id: string
          id: string
          is_active: boolean
          notes: string | null
          system_prompt: string
          user_prompt: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          feature_id: string
          id?: string
          is_active?: boolean
          notes?: string | null
          system_prompt: string
          user_prompt?: string | null
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          feature_id?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          system_prompt?: string
          user_prompt?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_versions_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "ai_features"
            referencedColumns: ["id"]
          },
        ]
      }
      quota_configs: {
        Row: {
          feature_id: string
          id: string
          monthly_limit: number
          tier_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          feature_id: string
          id?: string
          monthly_limit?: number
          tier_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          feature_id?: string
          id?: string
          monthly_limit?: number
          tier_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quota_configs_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "ai_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quota_configs_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quota_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quota_usage: {
        Row: {
          feature_id: string
          id: string
          period_end: string
          period_start: string
          subscription_id: string
          used_count: number
          user_id: string
        }
        Insert: {
          feature_id: string
          id?: string
          period_end: string
          period_start: string
          subscription_id: string
          used_count?: number
          user_id: string
        }
        Update: {
          feature_id?: string
          id?: string
          period_end?: string
          period_start?: string
          subscription_id?: string
          used_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quota_usage_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "ai_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quota_usage_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quota_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_log: {
        Row: {
          feature_slug: string
          id: string
          requested_at: string
          user_id: string
        }
        Insert: {
          feature_slug: string
          id?: string
          requested_at?: string
          user_id: string
        }
        Update: {
          feature_slug?: string
          id?: string
          requested_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skin_profiles: {
        Row: {
          analysis_notes: string
          created_at: string
          id: string
          is_active: boolean
          raw_ai_response: Json
          scan_image_url: string | null
          skin_concerns: string[]
          skin_type: string
          user_id: string
        }
        Insert: {
          analysis_notes?: string
          created_at?: string
          id?: string
          is_active?: boolean
          raw_ai_response?: Json
          scan_image_url?: string | null
          skin_concerns?: string[]
          skin_type: string
          user_id: string
        }
        Update: {
          analysis_notes?: string
          created_at?: string
          id?: string
          is_active?: boolean
          raw_ai_response?: Json
          scan_image_url?: string | null
          skin_concerns?: string[]
          skin_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skin_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          created_at: string
          features: Json
          id: string
          is_active: boolean
          name: string
          price_idr: number
          slug: string
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price_idr?: number
          slug: string
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_idr?: number
          slug?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          payment_ref: string | null
          quota_reset_at: string
          started_at: string
          status: string
          tier_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_ref?: string | null
          quota_reset_at: string
          started_at?: string
          status?: string
          tier_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_ref?: string | null
          quota_reset_at?: string
          started_at?: string
          status?: string
          tier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tripay_invoices: {
        Row: {
          amount_idr: number
          checkout_url: string | null
          created_at: string
          expired_at: string | null
          id: string
          merchant_ref: string
          pay_url: string | null
          plan: string
          qr_url: string | null
          reference: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_idr: number
          checkout_url?: string | null
          created_at?: string
          expired_at?: string | null
          id?: string
          merchant_ref: string
          pay_url?: string | null
          plan?: string
          qr_url?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_idr?: number
          checkout_url?: string | null
          created_at?: string
          expired_at?: string | null
          id?: string
          merchant_ref?: string
          pay_url?: string | null
          plan?: string
          qr_url?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tripay_invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_missions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_count: number
          id: string
          is_completed: boolean
          last_activity: string | null
          mission_id: string
          next_available: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_count?: number
          id?: string
          is_completed?: boolean
          last_activity?: string | null
          mission_id: string
          next_available?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_count?: number
          id?: string
          is_completed?: boolean
          last_activity?: string | null
          mission_id?: string
          next_available?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      xendit_invoices: {
        Row: {
          amount_idr: number
          coin_amount: number
          created_at: string
          id: string
          invoice_url: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_idr: number
          coin_amount: number
          created_at?: string
          id: string
          invoice_url: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_idr?: number
          coin_amount?: number
          created_at?: string
          id?: string
          invoice_url?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xendit_invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xendit_webhooks: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          xendit_event_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          xendit_event_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          xendit_event_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_mission: { Args: { p_mission_slug: string }; Returns: Json }
      credit_coins: {
        Args: {
          p_amount: number
          p_mission_id: string
          p_notes?: string
          p_user_id: string
        }
        Returns: undefined
      }
      deduct_coins: {
        Args: { p_amount: number; p_reference_id: string; p_user_id: string }
        Returns: boolean
      }
      deduct_quota: {
        Args: {
          p_feature_id: string
          p_subscription_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      get_decrypted_secret: { Args: { secret_name: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      record_mission_progress: {
        Args: { p_action: string; p_count?: number; p_user_id: string }
        Returns: undefined
      }
      rollback_deduction: {
        Args: {
          p_coin_amount?: number
          p_coin_ref?: string
          p_feature_id: string
          p_mode: string
          p_subscription_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      track_daily_login: { Args: never; Returns: Json }
      track_profile_completion: { Args: never; Returns: Json }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    Enums: {},
  },
} as const
