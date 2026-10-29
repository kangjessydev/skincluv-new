// src/components/ui/Toast.tsx
// Universal Mobile-First & Desktop Toast Notification Component
// Cluv Framework standard: Responsive (bottom-right / mobile bottom), Accessible, Dismissible, Animated Progress Countdown

import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  isOpen: boolean
  onClose: () => void
  variant?: ToastVariant
  title?: string
  message: ReactNode
  /** Duration in ms before auto-dismissing. Set to 0 to disable auto-dismiss. Default is 4000ms. */
  duration?: number
  className?: string
}

export default function Toast({
  isOpen,
  onClose,
  variant = 'success',
  title,
  message,
  duration = 4000,
  className = '',
}: ToastProps) {
  if (!isOpen || typeof document === 'undefined') return null

  // Variant Icon & Squircle Wrap class mapping
  const variantConfig = {
    success: {
      icon: <CheckCircle2 size={16} />,
      wrapClass: 'is-teal',
    },
    error: {
      icon: <AlertTriangle size={16} />,
      wrapClass: 'is-rose',
    },
    warning: {
      icon: <AlertCircle size={16} />,
      wrapClass: 'is-gold',
    },
    info: {
      icon: <Info size={16} />,
      wrapClass: 'is-blue',
    },
  }[variant]

  return createPortal(
    <div className="cluv-toast-container" role="region" aria-live="polite">
      <div
        className={`cluv-toast is-${variant} ${className}`}
        role="alert"
        aria-atomic="true"
      >
        <div className="cluv-toast-inner">
          {/* Action Icon in Squircle Wrap */}
          <div className={`cluv-card-icon-wrap is-sm ${variantConfig.wrapClass} cluv-toast-icon-wrap`}>
            {variantConfig.icon}
          </div>

          {/* Text Content */}
          <div className="cluv-toast-content">
            {title && <h4 className="cluv-toast-title">{title}</h4>}
            <div className="cluv-toast-message">{message}</div>
          </div>

          {/* Close Dismiss Button */}
          <button
            type="button"
            className="cluv-toast-close"
            onClick={onClose}
            aria-label="Tutup notifikasi"
          >
            <X size={15} />
          </button>
        </div>

        {/* Auto-Dismiss Progress Bar Countdown */}
        {duration > 0 && (
          <div className="cluv-toast-progress-track">
            <div
              className="cluv-toast-progress-bar"
              style={{ animationDuration: `${duration}ms` }}
              onAnimationEnd={onClose}
            />
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
