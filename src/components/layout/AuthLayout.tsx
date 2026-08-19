import { Outlet } from 'react-router-dom'

/**
 * Auth layout — wraps login/register pages with a clean
 * solid background and centered pure white card.
 */
export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        {/* Logo / Brand */}
        <div className="auth-brand animate-fade-in">
          <div className="auth-logo">
            <span>✦</span>
          </div>
          <h1 className="auth-brand-name gradient-text">Skincluv</h1>
          <p className="auth-brand-tagline">Asisten Kesehatan & Perawatan Kulitmu</p>
        </div>

        {/* Page content (login/register form) */}
        <div className="auth-card glass-card animate-fade-in">
          <Outlet />
        </div>
      </div>

      <style>{`
        .auth-layout {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface-1);
          padding: var(--space-md);
          position: relative;
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
          width: 56px;
          height: 56px;
          background: var(--color-brand-600);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto var(--space-md);
          font-size: 24px;
          color: white;
          box-shadow: var(--shadow-accent);
        }

        .auth-brand-name {
          font-size: 2rem;
          margin-bottom: var(--space-xs);
          color: var(--color-text-primary);
          font-family: var(--font-heading);
        }

        .auth-brand-tagline {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          font-family: var(--font-body);
        }

        .auth-card {
          padding: var(--space-xl);
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </div>
  )
}
