// src/components/ui/BottomSheet.tsx
// Universal Mobile-First Bottom Sheet & Modal Component
// Cluv Framework standard: Responsive, Accessible (Esc key, Backdrop close, ARIA), Thumb-Friendly

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  showHandle?: boolean
  className?: string
  contentClassName?: string
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  showHandle = true,
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

  if (!isOpen) return null

  return (
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
        {/* Mobile Drag Indicator Handle */}
        {showHandle && <div className="cluv-sheet-handle" aria-hidden="true" />}

        {/* Header Bar */}
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
            <button
              type="button"
              className="cluv-sheet-close"
              onClick={onClose}
              aria-label="Tutup panel"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className={`cluv-sheet-body ${contentClassName}`}>
          {children}
        </div>

        {/* Optional Sticky Footer Actions */}
        {footer && (
          <div className="cluv-sheet-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
