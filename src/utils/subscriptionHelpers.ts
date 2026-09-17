// src/utils/subscriptionHelpers.ts
// Centralized helper for subscription tier status checks

export function isActivePremium(subscription: any): boolean {
  if (!subscription) return false
  if (subscription.status !== 'active') return false

  const slug = subscription?.subscription_tiers?.slug
  const name = subscription?.subscription_tiers?.name?.toLowerCase()

  return (
    slug === 'premium' ||
    slug === 'pro' ||
    name === 'premium' ||
    name === 'pro'
  )
}

export function isActiveGlow(subscription: any): boolean {
  if (!subscription) return false
  if (subscription.status !== 'active') return false

  const slug = subscription?.subscription_tiers?.slug
  const name = subscription?.subscription_tiers?.name?.toLowerCase()

  return slug === 'glow' || name === 'glow'
}

export function getSubscriptionTier(subscription: any): 'pro' | 'glow' | 'free' {
  if (isActivePremium(subscription)) return 'pro'
  if (isActiveGlow(subscription)) return 'glow'
  return 'free'
}

export function hasPaidAiQuota(subscription: any): boolean {
  return isActivePremium(subscription) || isActiveGlow(subscription)
}

export const DEFAULT_FEATURE_CREDIT_COSTS: Record<string, number> = {
  chatbot: 1,
  ingredient_scan: 3,
  face_analysis: 5,
}

// Global in-memory cache for dynamic feature credit costs
let dynamicFeatureCreditCosts: Record<string, number> = { ...DEFAULT_FEATURE_CREDIT_COSTS }

export function setDynamicCreditCosts(costs: Record<string, number>) {
  dynamicFeatureCreditCosts = { ...dynamicFeatureCreditCosts, ...costs }
}

export function getFeatureCreditCost(featureSlug: string): number {
  return dynamicFeatureCreditCosts[featureSlug] ?? DEFAULT_FEATURE_CREDIT_COSTS[featureSlug] ?? 1
}

// Proxy wrapper agar kode lama yang membaca FEATURE_CREDIT_COSTS otomatis mendapat nilai dinamis terbaru
export const FEATURE_CREDIT_COSTS: Record<string, number> = new Proxy(DEFAULT_FEATURE_CREDIT_COSTS, {
  get(target, prop: string) {
    return dynamicFeatureCreditCosts[prop] ?? target[prop] ?? 1
  },
})

export function canAccessAiFeature(
  feature: 'chatbot' | 'ingredient_scan' | 'face_analysis',
  subscription: any,
  credits: number,
  customCost?: number
): { canAccess: boolean; cost: number; isFreeTier: boolean } {
  const isFreeTier = !hasPaidAiQuota(subscription)
  const cost = customCost ?? getFeatureCreditCost(feature)
  const canAccess = !isFreeTier || credits >= cost
  return { canAccess, cost, isFreeTier }
}

