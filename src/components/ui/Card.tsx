// src/components/ui/Card.tsx
// Reusable Card atom — RFC 019 T4
// Uses global CSS tokens from index.css

import { type ReactNode, type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: 'default' | 'tinted' | 'flat'
  /** Padding size */
  size?: 'sm' | 'md' | 'lg'
  /** Whether card lifts on hover */
  hoverable?: boolean
  children: ReactNode
}

const SIZE_MAP = {
  sm: '16px',
  md: '24px',
  lg: '32px',
}

const VARIANT_STYLES: Record<string, string> = {
  default: `
    background: var(--color-surface);
    border: var(--hairline);
    box-shadow: var(--shadow-card);
  `,
  tinted: `
    background: var(--color-teal-soft);
    border: 1px solid rgba(31, 157, 151, 0.15);
    box-shadow: none;
  `,
  flat: `
    background: var(--color-surface-muted);
    border: var(--hairline);
    box-shadow: none;
  `,
}

export function Card({
  variant = 'default',
  size = 'md',
  hoverable = false,
  children,
  style,
  className = '',
  ...rest
}: CardProps) {
  const padding = SIZE_MAP[size]

  return (
    <div
      className={`skincluv-card ${hoverable ? 'skincluv-card--hoverable' : ''} ${className}`}
      style={{
        borderRadius: 'var(--radius-lg)',
        padding,
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
        ...style,
      }}
      data-variant={variant}
      {...rest}
    >
      {children}

      <style>{`
        .skincluv-card[data-variant="default"] {
          background: var(--color-surface);
          border: var(--hairline);
          box-shadow: var(--shadow-card);
        }
        .skincluv-card[data-variant="tinted"] {
          background: var(--color-teal-soft);
          border: 1px solid rgba(31, 157, 151, 0.15);
          box-shadow: none;
        }
        .skincluv-card[data-variant="flat"] {
          background: var(--color-surface-muted);
          border: var(--hairline);
          box-shadow: none;
        }
        .skincluv-card--hoverable:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}
