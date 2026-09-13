// src/components/ui/ErrorBoundary.tsx
// Global React Error Boundary component for graceful error fallback

import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Skincluv ErrorBoundary] Uncaught exception:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-wrapper">
          <div className="error-boundary-card">
            <div className="error-icon-wrap">
              <AlertTriangle size={32} />
            </div>
            <h2>Terjadi Kesalahan Tampilan</h2>
            <p>
              Maaf, aplikasi mengalami kendala saat memuat halaman ini. Silakan muat ulang halaman.
            </p>
            {this.state.error && (
              <pre className="error-details">
                {this.state.error.toString()}
              </pre>
            )}
            <div className="error-actions">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={14} /> Muat Ulang Halaman
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={this.handleReset}
              >
                <Home size={14} /> Kembali ke Beranda
              </button>
            </div>
          </div>

          <style>{`
            .error-boundary-wrapper {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: var(--space-lg);
              background: var(--color-surface-bg);
              font-family: var(--font-body);
            }
            .error-boundary-card {
              background: var(--color-surface-container-lowest);
              border: 1px solid var(--color-secondary-container);
              border-radius: var(--radius-2xl);
              padding: var(--space-2xl);
              max-width: 480px;
              width: 100%;
              text-align: center;
              box-shadow: 0 16px 32px rgba(0, 101, 145, 0.08);
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: var(--space-md);
            }
            .error-icon-wrap {
              width: 56px;
              height: 56px;
              border-radius: 50%;
              background: #fef2f2;
              color: var(--color-error);
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .error-boundary-card h2 {
              font-size: 1.25rem;
              font-family: var(--font-heading);
              margin: 0;
            }
            .error-boundary-card p {
              font-size: 0.875rem;
              color: var(--color-text-muted);
              margin: 0;
              line-height: 1.5;
            }
            .error-details {
              background: var(--color-surface-container-low);
              border-radius: var(--radius-md);
              padding: var(--space-xs) var(--space-sm);
              font-size: 0.75rem;
              color: var(--color-error);
              max-width: 100%;
              overflow-x: auto;
              white-space: pre-wrap;
              word-break: break-all;
            }
            .error-actions {
              display: flex;
              gap: var(--space-sm);
              width: 100%;
              margin-top: var(--space-xs);
            }
            .error-actions .btn {
              flex: 1;
              justify-content: center;
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
