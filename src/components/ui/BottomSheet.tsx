// src/components/ui/BottomSheet.tsx
// Universal Mobile-First Bottom Sheet & Modal Component
// Cluv Framework standard: Responsive, Accessible (Esc key, Backdrop close, ARIA), Thumb-Friendly
// v2: No footer, no close X button. Dismissed via drag handle or backdrop tap.

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'

export interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  subtitle?: string
  children: React.ReactNode
  /** Enable dragging up to expand full height. Default is true. */
  expandable?: boolean
  /** Initial expanded state. Default is false. */
  initialExpanded?: boolean
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
  expandable = true,
  initialExpanded = false,
  className = '',
  contentClassName = '',
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(initialExpanded)
  const [isDragging, setIsDragging] = useState(false)
  const startYRef = useRef<number>(0)
  const currentDeltaRef = useRef<number>(0)

  useEffect(() => {
    setIsExpanded(initialExpanded)
  }, [isOpen, initialExpanded])

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

  // Pointer drag gestures (mouse + touch)
  const handlePointerDown = (e: PointerEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (e.button !== 0) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    startYRef.current = e.clientY
    currentDeltaRef.current = 0
    setIsDragging(true)
  }

  const handlePointerMove = (e: PointerEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (!isDragging || !panelRef.current) return
    const deltaY = e.clientY - startYRef.current
    currentDeltaRef.current = deltaY

    if (deltaY > 0) {
      // Dragging downward
      panelRef.current.style.transform = `translateY(${deltaY}px)`
    } else if (deltaY < 0 && !isExpanded && expandable) {
      // Dragging upward with slight resistance
      panelRef.current.style.transform = `translateY(${deltaY * 0.45}px)`
    }
  }

  const handlePointerUp = (e: PointerEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (!isDragging) return
    setIsDragging(false)
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // Ignore if capture was already released
    }

    if (panelRef.current) {
      panelRef.current.style.transform = ''
    }

    const deltaY = currentDeltaRef.current

    // Dragged down significantly
    if (deltaY > 75) {
      if (isExpanded) {
        setIsExpanded(false)
      } else {
        onClose()
      }
      return
    }

    // Dragged up significantly
    if (deltaY < -40 && expandable && !isExpanded) {
      setIsExpanded(true)
      return
    }

    // Single quick tap on handle (minimal movement < 10px)
    if (Math.abs(deltaY) < 10 && expandable) {
      setIsExpanded((prev) => !prev)
    }
  }

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
        className={`cluv-sheet-panel ${isExpanded ? 'is-expanded' : ''} ${isDragging ? 'is-dragging' : ''} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Indicator Handle — tap to toggle / drag up to expand / drag down to close */}
        <button
          type="button"
          className="cluv-sheet-handle-btn"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label={isExpanded ? 'Perkecil panel' : 'Perbesar atau tutup panel'}
        >
          <span className="cluv-sheet-handle" aria-hidden="true" />
        </button>

        {/* Header Bar — draggable as well */}
        {(title || subtitle) && (
          <div
            className="cluv-sheet-header"
            style={{ cursor: 'grab', userSelect: 'none', touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
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
