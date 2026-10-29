// src/components/ui/BottomSheet.tsx
// Universal Mobile-First Bottom Sheet & Modal Component
// Cluv Framework standard: Responsive, Accessible (Esc key, Backdrop close, ARIA), Thumb-Friendly
// v2: No footer, no close X button. Dismissed via drag handle or backdrop tap.

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  subtitle?: string
  children: React.ReactNode
  /** @deprecated Footer removed per UX spec. Pass content inside children instead. */
  footer?: React.ReactNode
  className?: string
  contentClassName?: string
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className = '',
  contentClassName = '',
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    // Prevent background scrolling while bottom sheet is active
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="cluv-sheet-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'Dialog Bottom Sheet'}
    >
      <div
        ref={panelRef}
        className={`cluv-sheet-panel ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Indicator Handle — tap/drag to dismiss */}
        <button
          type="button"
          className="cluv-sheet-handle-btn"
          onClick={onClose}
          aria-label="Tutup panel"
        >
          <span className="cluv-sheet-handle" aria-hidden="true" />
        </button>

        {/* Header Bar — title + subtitle only, no close X */}
        {(title || subtitle) && (
          <div className="cluv-sheet-header">
            <div>
              {typeof title === 'string' ? (
                <h3 className="cluv-sheet-title">{title}</h3>
              ) : (
                title
              )}
              {subtitle && <p className="cluv-sheet-subtitle">{subtitle}</p>}
            </div>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className={`cluv-sheet-body ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
