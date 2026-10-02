// src/components/ui/ErrorBoundary.tsx
// Global React Error Boundary component for graceful error fallback

import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import '@/styles/ui-components.css'

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


        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
