// src/components/ui/Alert.tsx
// 100% Cluv Framework Canonical Alert Component (Lapis 3: Type-safe React Atom)
// Adheres strictly to the slot architecture & mobile responsive discipline.

import { type ReactNode } from 'react'
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from 'lucide-react'

export type AlertVariant = 'warning' | 'danger' | 'info' | 'success'

export interface AlertProps {
  /** Visual variant styling */
  variant?: AlertVariant
  /** Title text or node */
  title?: ReactNode
  /** Custom icon or omit to use semantic auto-icon */
  icon?: ReactNode
  /** Slot for action button(s), e.g. <Button variant="primary" size="sm">...</Button> */
  action?: ReactNode
  /** Callback when close button is clicked; if provided, renders close 'X' */
  onClose?: () => void
  /** Compact padding modifier for dense interfaces */
  compact?: boolean
  /** Custom class overrides if needed */
  className?: string
  /** Alert message body */
  children?: ReactNode
}

const DEFAULT_ICONS: Record<AlertVariant, ReactNode> = {
  warning: <AlertTriangle size={18} />,
  danger: <AlertCircle size={18} />,
  info: <Info size={18} />,
  success: <CheckCircle2 size={18} />,
}

export function Alert({
  variant = 'info',
  title,
  icon,
  action,
  onClose,
  compact = false,
  className = '',
  children,
}: AlertProps) {
  const renderedIcon = icon !== undefined ? icon : DEFAULT_ICONS[variant]

  return (
    <div
      role="alert"
      className={`cluv-alert is-${variant} ${compact ? 'is-compact' : ''} ${className}`}
    >
      {renderedIcon && <div className="cluv-alert-icon">{renderedIcon}</div>}

      <div className="cluv-alert-content">
        {title && <div className="cluv-alert-title">{title}</div>}
        {children && <div className="cluv-alert-message">{children}</div>}
      </div>

      {action && <div className="cluv-alert-actions">{action}</div>}

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="cluv-alert-close"
          aria-label="Tutup notifikasi"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
