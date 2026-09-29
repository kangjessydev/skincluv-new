// src/components/ui/SkeletonLoader.tsx
// Reusable skeleton loading placeholder — RFC 019 T4
// Digunakan saat data sedang di-fetch, mencegah layout shift

import { type CSSProperties } from 'react'

interface SkeletonProps {
  /** Lebar skeleton — default 100% */
  width?: string | number
  /** Tinggi skeleton — default 16px */
  height?: string | number
  /** Border radius — default var(--radius) */
  radius?: string
  /** Tambahan class */
  className?: string
  /** Inline style tambahan */
  style?: CSSProperties
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 'var(--radius)',
  className = '',
  style,
}: SkeletonProps) {
  return (
    <>
      <span
        className={`skincluv-skeleton ${className}`}
        style={{
          display: 'block',
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          borderRadius: radius,
          ...style,
        }}
        aria-hidden="true"
      />
      <style>{`
        .skincluv-skeleton {
          background: linear-gradient(
            90deg,
            var(--color-border-soft) 25%,
            #eaf2f8 50%,
            var(--color-border-soft) 75%
          );
          background-size: 200% 100%;
          animation: skincluv-shimmer 1.6s infinite;
        }
        @keyframes skincluv-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  )
}

// ---- Preset Compositions ----

/** Skeleton untuk satu baris teks pendek */
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === lines - 1 && lines > 1 ? '65%' : '100%'}
        />
      ))}
    </div>
  )
}

/** Skeleton untuk kartu score ring (face scan result) */
export function SkeletonCard({ height = 200 }: { height?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton height={height} radius="var(--radius-lg)" />
      <SkeletonText lines={2} />
    </div>
  )
}
