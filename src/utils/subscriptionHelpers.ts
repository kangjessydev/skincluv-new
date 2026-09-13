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

