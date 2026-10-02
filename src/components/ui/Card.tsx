// src/components/ui/Card.tsx
// Reusable Card atom — RFC 019 T4
// Uses global CSS tokens from index.css

import { type ReactNode, type HTMLAttributes } from 'react'
import '@/styles/ui-components.css'

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
    </div>
  )
}
