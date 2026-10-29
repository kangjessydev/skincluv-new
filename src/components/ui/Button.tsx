// src/components/ui/Button.tsx
// 100% Cluv Framework Canonical Button Atom
// Modular, accessible touch-target, strongly-typed props.

import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonRadius = 'default' | 'pill' | 'rounded' | 'sm' | 'none'

interface BaseButtonCustomProps {
  variant?: ButtonVariant
  size?: ButtonSize
  radius?: ButtonRadius
  pill?: boolean
  block?: boolean
  stackMobile?: boolean
  loading?: boolean
  disabled?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  children: ReactNode
}

export type ButtonAsButton = BaseButtonCustomProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonCustomProps> & {
    to?: never
    href?: never
  }

export type ButtonAsLink = BaseButtonCustomProps &
  Omit<LinkProps, keyof BaseButtonCustomProps> & {
    to: string
    href?: never
  }

export type ButtonAsAnchor = BaseButtonCustomProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonCustomProps> & {
    href: string
    to?: never
  }

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(
  props,
  ref
) {
  const {
    variant = 'primary',
    size = 'md',
    radius = 'default',
    pill = false,
    block = false,
    stackMobile = false,
    loading = false,
    disabled = false,
    iconLeft,
    iconRight,
    className = '',
    children,
    ...rest
  } = props

  // Determine radius class
  let radiusClass = ''
  if (pill || radius === 'pill') {
    radiusClass = 'is-pill'
  } else if (radius === 'rounded') {
    radiusClass = 'is-rounded'
  } else if (radius === 'sm') {
    radiusClass = 'is-radius-sm'
  } else if (radius === 'none') {
    radiusClass = 'is-radius-none'
  }

  const classes = [
    'cluv-btn',
    `is-${variant}`,
    `is-${size}`,
    radiusClass,
    block ? 'is-block' : '',
    stackMobile ? 'is-stack-mobile' : '',
    loading ? 'is-loading' : '',
    disabled || loading ? 'is-disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {loading ? (
        <span className="cluv-btn-spinner" aria-hidden="true" />
      ) : (
        iconLeft && <span className="cluv-flex cluv-items-center cluv-flex-shrink-0">{iconLeft}</span>
      )}
      <span className="cluv-btn-text">{children}</span>
      {!loading && iconRight && (
        <span className="cluv-flex cluv-items-center cluv-flex-shrink-0">{iconRight}</span>
      )}
    </>
  )

  // Polymorphic rendering: Link (React Router)
  if ('to' in props && props.to) {
    const { to, onClick, ...linkRest } = rest as Omit<LinkProps, keyof BaseButtonCustomProps> & { to: string }
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        to={to}
        className={classes}
        aria-disabled={disabled || loading ? true : undefined}
        tabIndex={disabled || loading ? -1 : undefined}
        onClick={(e) => {
          if (disabled || loading) {
            e.preventDefault()
            return
          }
          onClick?.(e)
        }}
        {...linkRest}
      >
        {content}
      </Link>
    )
  }

  // Polymorphic rendering: Anchor (External URL)
  if ('href' in props && props.href) {
    const { href, onClick, ...anchorRest } = rest as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonCustomProps> & { href: string }
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        aria-disabled={disabled || loading ? true : undefined}
        tabIndex={disabled || loading ? -1 : undefined}
        onClick={(e) => {
          if (disabled || loading) {
            e.preventDefault()
            return
          }
          onClick?.(e)
        }}
        {...anchorRest}
      >
        {content}
      </a>
    )
  }

  // Standard Button
  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={buttonRest.type || 'button'}
      className={classes}
      disabled={disabled || loading}
      {...buttonRest}
    >
      {content}
    </button>
  )
})
