// src/components/ui/EmptyState.tsx
// Reusable empty state placeholder — RFC 019 T4
// Digunakan saat data kosong, bukan sebagai error state

import { type ElementType } from 'react'
import { ScanFace, PackageSearch, MessageSquare, History } from 'lucide-react'

interface EmptyStateProps {
  /** Icon dari lucide-react atau custom SVG */
  icon?: ElementType
  /** Judul singkat (apa yang kosong) */
  title: string
  /** Deskripsi optional — satu kalimat mengajak action */
  description?: string
  /** Tombol aksi primary */
  action?: {
    label: string
    onClick: () => void
  }
  /** Aksi sekunder (link teks) */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  /** Visual size */
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CONFIG = {
  sm: { iconSize: 36, iconBox: 56, titleSize: '14px', descSize: '12px', gap: 12, padding: '24px 16px' },
  md: { iconSize: 44, iconBox: 68, titleSize: '16px', descSize: '13.5px', gap: 16, padding: '40px 24px' },
  lg: { iconSize: 52, iconBox: 80, titleSize: '18px', descSize: '14px', gap: 20, padding: '56px 32px' },
}

export function EmptyState({
  icon: Icon = PackageSearch,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
}: EmptyStateProps) {
  const cfg = SIZE_CONFIG[size]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: cfg.padding,
        gap: cfg.gap,
      }}
    >
      {/* Icon container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: cfg.iconBox,
          height: cfg.iconBox,
          borderRadius: 'var(--radius-xl)',
          background: 'var(--color-surface-muted)',
          border: 'var(--hairline)',
          color: 'var(--color-ink-muted)',
          flexShrink: 0,
        }}
      >
        <Icon size={cfg.iconSize} strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p
          style={{
            margin: 0,
            fontSize: cfg.titleSize,
            fontWeight: 700,
            color: 'var(--color-ink)',
            lineHeight: 1.3,
          }}
        >
          {title}
        </p>
        {description && (
          <p
            style={{
              margin: 0,
              fontSize: cfg.descSize,
              color: 'var(--color-ink-soft)',
              lineHeight: 1.6,
              maxWidth: 280,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 4 }}>
          {action && (
            <button
              onClick={action.onClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--color-teal)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius)',
                padding: '10px 20px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-teal-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-teal)' }}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-teal)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ---- Preset Empty States untuk konteks Skincluv ----

export function EmptyFaceScan({ onScan }: { onScan: () => void }) {
  return (
    <EmptyState
      icon={ScanFace}
      title="Belum ada analisis kulit"
      description="Lakukan Analisis Kulit AI pertamamu untuk melihat kondisi kulit secara mendalam."
      action={{ label: 'Mulai Analisis Kulit', onClick: onScan }}
    />
  )
}

export function EmptyIngredientScan({ onScan }: { onScan: () => void }) {
  return (
    <EmptyState
      icon={PackageSearch}
      title="Belum ada scan produk"
      description="Scan komposisi produk skincare kamu untuk cek keamanan bahannya."
      action={{ label: 'Scan Produk Sekarang', onClick: onScan }}
    />
  )
}

export function EmptyChatHistory({ onChat }: { onChat: () => void }) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Mulai percakapan"
      description="Tanya Skinsistant AI tentang kulitmu, rekomendasi rutinitas, atau produk."
      action={{ label: 'Mulai Konsultasi', onClick: onChat }}
    />
  )
}

export function EmptyScanHistory({ onScan }: { onScan: () => void }) {
  return (
    <EmptyState
      icon={History}
      title="Riwayat masih kosong"
      description="Riwayat analisis kulitmu akan muncul di sini setelah kamu melakukan scan pertama."
      action={{ label: 'Lakukan Analisis Pertama', onClick: onScan }}
    />
  )
}
