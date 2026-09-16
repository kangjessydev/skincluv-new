// ============================================================
// Skincluv — Database Types
// Generated manually from schema design. Update after running
// `supabase gen types typescript` once project is connected.
// ============================================================

import type { Database as GeneratedDatabase } from './database.types'

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ----------------------------------------------------------------
// Enums & Literals
// ----------------------------------------------------------------
export type SkinType = 'normal' | 'oily' | 'dry' | 'combination' | 'sensitive' | (string & {})
export type SkinConcern =
  | 'acne'
  | 'hyperpigmentation'
  | 'wrinkles'
  | 'dryness'
  | 'oiliness'
  | 'sensitivity'
  | 'redness'
  | 'dark_circles'
  | 'pores'
  | (string & {})

export type AiProvider = 'google' | 'anthropic' | 'openai'
export type FeatureSlug = 'face_validation' | 'face_analysis' | 'ingredient_scan' | 'chatbot'

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | (string & {})
export type CoinTransactionType = 'mission_reward' | 'ai_usage' | 'admin_adjustment' | (string & {})
export type MissionType = 'daily' | 'weekly' | 'one_time' | 'streak' | 'social'
export type AiRequestStatus = 'success' | 'error' | 'rejected_no_face' | 'rejected_no_quota'
export type ListingType = 'organic' | 'affiliate' | 'endorse'

// ----------------------------------------------------------------
// Table Row Types
// ----------------------------------------------------------------

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface SkinProfile {
  id: string
  user_id: string
  scan_image_url: string | null
  skin_type: SkinType
  skin_concerns: SkinConcern[]
  analysis_notes: string
  raw_ai_response: Json
  is_active: boolean
  created_at: string
}

export interface FaceScan {
  id: string
  user_id: string
  overall_score: number
  skin_status_title: string | null
  skin_type: string
  skin_concerns: string[]
  analysis_notes: string | null
  area_evaluations: Json
  product_recommendations: Json
  raw_ai_response: Json
  created_at: string
}

export interface IngredientScan {
  id: string
  user_id: string
  product_name: string
  brand: string | null
  safety_score: number | null
  is_safe: boolean
  matched_concerns: string[]
  key_ingredients: string[]
  ingredients_breakdown: Json
  raw_ai_response: Json
  created_at: string
}

export interface AiFeature {
  id: string
  slug: FeatureSlug
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface PromptVersion {
  id: string
  feature_id: string
  version: number
  system_prompt: string
  user_prompt: string | null
  notes: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
}

export interface ModelConfig {
  id: string
  feature_id: string
  provider: AiProvider
  model_name: string
  api_key_secret: string
  parameters: Json
  is_active: boolean
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface SubscriptionTier {
  id: string
  slug: string
  name: string
  price_idr: number
  features: Json
  is_active: boolean
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  tier_id: string
  status: SubscriptionStatus
  started_at: string
  expires_at: string | null
  quota_reset_at: string
  payment_ref: string | null
  created_at: string
}

export interface QuotaConfig {
  id: string
  tier_id: string
  feature_id: string
  monthly_limit: number // -1 = unlimited
  updated_by: string | null
  updated_at: string
}

export interface QuotaUsage {
  id: string
  user_id: string
  feature_id: string
  subscription_id: string
  used_count: number
  period_start: string
  period_end: string
}

export interface CoinBalance {
  id: string
  user_id: string
  balance: number
  updated_at: string
}

export interface CoinTransaction {
  id: string
  user_id: string
  amount: number
  type: CoinTransactionType
  reference_id: string | null
  notes: string | null
  created_at: string
}

export interface Mission {
  id: string
  slug: string
  name: string
  description: string | null
  type: MissionType
  coin_reward: number
  target_count: number
  cooldown_hours: number | null
  is_active: boolean
  metadata: Json
  created_at: string
}

export interface UserMission {
  id: string
  user_id: string
  mission_id: string
  current_count: number
  is_completed: boolean
  completed_at: string | null
  last_activity: string | null
  next_available: string | null
  created_at: string
}

export interface AiRequestLog {
  id: string
  user_id: string
  feature_id: string
  prompt_version_id: string
  model_config_id: string
  input_summary: string | null
  output_summary: string | null
  raw_output: Json
  tokens_used: number | null
  latency_ms: number | null
  cost_usd: number | null
  status: AiRequestStatus
  user_feedback: -1 | 0 | 1 | null
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string | null
  created_at: string
  last_activity: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface XenditWebhook {
  id: string
  xendit_event_id: string
  event_type: string
  payload: Json
  processed: boolean
  processed_at: string | null
  created_at: string
}

export interface RateLimitLog {
  id: string
  user_id: string
  feature_slug: FeatureSlug
  requested_at: string
}

export interface TripayInvoice {
  id: string
  merchant_ref: string
  reference: string | null
  user_id: string
  amount_idr: number
  plan: string
  status: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUND'
  checkout_url: string | null
  pay_url: string | null
  qr_url: string | null
  expired_at: string | null
  created_at: string
  updated_at: string
}

// ----------------------------------------------------------------
// Supabase Database interface (for typed client)
// ----------------------------------------------------------------
export type Database = GeneratedDatabase
