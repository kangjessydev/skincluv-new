import { Outlet, Link } from 'react-router-dom'
import { Sparkles, ArrowLeft } from 'lucide-react'

/**
 * AuthLayout — Ported from scan-2 UI aesthetics.
 * Features ambient glowing background orbs, glassmorphic container,
 * gradient brand logo, back navigation, and centered card layout.
 */
export default function AuthLayout() {
  return (
    <div className="auth-layout-root">
      {/* BACKGROUND AMBIENT ORBS FROM SCAN-2 */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      {/* TOP BACK LINK */}
      <Link to="/" className="auth-back-link">
        <ArrowLeft size={16} />
        <span>Kembali ke Beranda</span>
      </Link>

      <div className="auth-container">
        {/* BRAND HEADER */}
        <div className="auth-brand">
          <div className="auth-logo-badge">
            <Sparkles size={28} />
          </div>
          <span className="auth-brand-kicker">SKINCLUV</span>
          <h1 className="auth-brand-tagline">Ruang Perawatan & Health AI Kulitmu</h1>
        </div>

        {/* MAIN CARD CONTAINER */}
        <div className="auth-card">
          <Outlet />
        </div>
      </div>

      <style>{`
        .auth-layout-root {
          min-height: 100dvh;
          width: 100%;
          background-color: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 80px 16px 40px 16px;
          overflow-x: hidden;
          font-family: var(--font-body, system-ui, sans-serif);
        }

        .auth-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(64px);
          pointer-events: none;
        }

        .auth-orb-1 {
          top: -10%;
          left: -10%;
          width: 450px;
          height: 450px;
          background: rgba(153, 246, 228, 0.4);
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .auth-orb-2 {
          bottom: -10%;
          right: -10%;
          width: 550px;
          height: 550px;
          background: rgba(186, 230, 253, 0.5);
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: 2s;
        }

        .auth-back-link {
          position: absolute;
          top: 24px;
          left: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #0f6784;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 9999px;
          text-decoration: none;
          z-index: 20;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(15, 103, 132, 0.05);
        }

        .auth-back-link:hover {
          background: #ffffff;
          transform: translateY(-1px);
          color: #0a4d63;
        }

        .auth-container {
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .auth-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 24px;
        }

        .auth-logo-badge {
          width: 60px;
          height: 60px;
          border-radius: 20px;
          background: linear-gradient(135deg, #0f6784 0%, #38bdf8 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px -5px rgba(15, 103, 132, 0.3);
          border: 2px solid #ffffff;
          margin-bottom: 16px;
        }

        .auth-brand-kicker {
          font-size: 0.75rem;
          font-weight: 900;
          color: #0f6784;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .auth-brand-tagline {
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          margin: 0;
        }

        .auth-card {
          width: 100%;
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 32px;
          padding: 36px 32px;
          box-shadow: 0 20px 40px -15px rgba(15, 103, 132, 0.08);
          position: relative;
          overflow: hidden;
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 28px 20px;
            border-radius: 24px;
          }
          .auth-back-link {
            top: 16px;
            left: 16px;
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}
