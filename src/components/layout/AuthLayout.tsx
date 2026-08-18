import { Outlet } from 'react-router-dom'

/**
 * Auth layout — wraps login/register pages with a full-page
 * gradient background and centered card.
 */
export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-bg-glow" />
      <div className="auth-bg-glow auth-bg-glow--2" />

      <div className="auth-container">
        {/* Logo / Brand */}
        <div className="auth-brand animate-fade-in">
          <div className="auth-logo">
            <span>✦</span>
          </div>
          <h1 className="auth-brand-name gradient-text">Skincluv</h1>
          <p className="auth-brand-tagline">Your AI-powered skin care companion</p>
        </div>

        {/* Page content (login/register form) */}
        <div className="auth-card glass-card animate-slide-up">
          <Outlet />
        </div>
      </div>

      <style>{`
        .auth-layout {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gradient-dark);
          padding: var(--space-md);
          position: relative;
          overflow: hidden;
        }

        .auth-bg-glow {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(107, 33, 168, 0.35) 0%, transparent 70%);
          top: -200px;
          left: -150px;
          pointer-events: none;
        }

        .auth-bg-glow--2 {
          background: radial-gradient(circle, rgba(244, 63, 143, 0.25) 0%, transparent 70%);
          top: auto;
          bottom: -200px;
          left: auto;
          right: -150px;
        }

        .auth-container {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          position: relative;
          z-index: 1;
        }

        .auth-brand {
          text-align: center;
        }

        .auth-logo {
          width: 64px;
          height: 64px;
          background: var(--gradient-brand);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto var(--space-md);
          font-size: 28px;
          box-shadow: var(--shadow-glow);
          animation: float 3s ease-in-out infinite;
        }

        .auth-brand-name {
          font-size: 2rem;
          margin-bottom: var(--space-xs);
        }

        .auth-brand-tagline {
          color: var(--color-text-muted);
          font-size: 0.875rem;
        }

        .auth-card {
          padding: var(--space-xl);
        }
      `}</style>
    </div>
  )
}
