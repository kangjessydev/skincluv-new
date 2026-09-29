// src/components/ui/Badge.tsx
// Reusable Badge atom — RFC 019 T4
// Status vocabulary sesuai RFC 019 Inv. 19: gunakan "optimal/attention/alert", bukan kata medis

import { type ReactNode } from 'react'

type BadgeVariant =
  | 'optimal'      // teal — kondisi kulit baik
  | 'attention'    // amber — perlu perhatian
  | 'alert'        // red — perlu segera ditindak
  | 'neutral'      // gray — informasi netral
  | 'info'         // blue — info tambahan
  | 'pro'          // teal gradient — PRO member

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  dot?: boolean    // tampilkan dot status di kiri
  size?: 'sm' | 'md'
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  optimal:   { bg: 'var(--color-status-optimal-soft)',    color: 'var(--color-status-optimal)',    border: 'rgba(31,157,151,0.2)' },
  attention: { bg: 'var(--color-status-attention-soft)',  color: 'var(--color-status-attention)',  border: 'rgba(217,119,6,0.2)' },
  alert:     { bg: 'var(--color-status-alert-soft)',      color: 'var(--color-status-alert)',      border: 'rgba(220,38,38,0.2)' },
  neutral:   { bg: 'var(--color-surface-muted)',          color: 'var(--color-ink-soft)',          border: 'var(--color-border)' },
  info:      { bg: 'var(--color-blue-soft)',              color: 'var(--color-blue)',              border: 'rgba(75,145,198,0.2)' },
  pro:       { bg: 'var(--color-teal-soft)',              color: 'var(--color-teal)',              border: 'rgba(31,157,151,0.25)' },
}

export function Badge({
  variant = 'neutral',
  children,
  dot = false,
  size = 'md',
}: BadgeProps) {
  const { bg, color, border } = VARIANT_STYLES[variant]
  const isSmall = size === 'sm'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        background: bg,
        color,
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius-full)',
        padding: isSmall ? '2px 8px' : '4px 10px',
        fontSize: isSmall ? '11px' : '12px',
        fontWeight: 700,
        letterSpacing: '0.01em',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <span
          style={{
            width: isSmall ? 6 : 7,
            height: isSmall ? 6 : 7,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
