// src/components/ui/Badge.tsx
// 100% Cluv Framework Canonical Badge Atom
// Strongly-typed, zero inline-styles, supports semantic & clinical aliases.

import { type ReactNode } from 'react'

export type BadgeVariant =
  | 'teal'
  | 'gold'
  | 'slate'
  | 'rose'
  | 'purple'
  // Semantic status aliases for backwards compatibility
  | 'optimal'
  | 'attention'
  | 'alert'
  | 'neutral'
  | 'info'
  | 'pro'

export interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  dot?: boolean
  pulse?: boolean
  icon?: ReactNode
  title?: string
  className?: string
  children: ReactNode
}

const VARIANT_CLASS_MAP: Record<BadgeVariant, string> = {
  teal: 'is-teal',
  gold: 'is-gold',
  slate: 'is-slate',
  rose: 'is-rose',
  purple: 'is-purple',
  // Clinical / status aliases
  optimal: 'is-teal',
  attention: 'is-gold',
  alert: 'is-rose',
  neutral: 'is-slate',
  info: 'is-slate',
  pro: 'is-teal',
}

export function Badge({
  variant = 'teal',
  size = 'md',
  dot = false,
  pulse = false,
  icon,
  title,
  className = '',
  children,
}: BadgeProps) {
  const variantClass = VARIANT_CLASS_MAP[variant] || 'is-teal'
  const sizeClass = size === 'sm' ? 'is-sm' : ''

  return (
    <span
      className={`cluv-badge ${variantClass} ${sizeClass} ${className}`.trim()}
      title={title}
    >
      {dot && (
        <span
          className={`cluv-dot ${pulse ? 'is-pulse' : ''}`.trim()}
          aria-hidden="true"
        />
      )}
      {icon && <span className="cluv-flex cluv-items-center cluv-flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}
