// src/components/layout/AuthLayout.tsx
// 100% Faithful Port of scan-2 AuthLayout — Pure Vanilla CSS (Zero Tailwind)

import { Outlet, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="scan2-auth-layout-root">
      {/* BACKGROUND AMBIENT ORBS FROM SCAN-2 */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      {/* TOP LEFT BACK LINK — Pure scan-2 style */}
      <Link to="/" className="scan2-auth-back-link">
        <ArrowLeft size={16} />
        <span>KEMBALI</span>
      </Link>

      {/* MAIN CONTAINER */}
      <div className="scan2-auth-container">
        <Outlet />
      </div>

      {/* PURE VANILLA CSS STYLING */}
      <style>{`
        .scan2-auth-layout-root {
          min-height: 100dvh;
          width: 100%;
          background-color: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 48px 16px;
          overflow-y: auto;
          overflow-x: hidden;
          font-family: var(--font-body, system-ui, sans-serif);
          box-sizing: border-box;
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
          animation: orbPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .auth-orb-2 {
          bottom: -10%;
          right: -10%;
          width: 550px;
          height: 550px;
          background: rgba(186, 230, 253, 0.5);
          animation: orbPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: 2s;
        }

        .scan2-auth-back-link {
          position: absolute;
          top: 24px;
          left: 24px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #0f6784;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-decoration: none;
          z-index: 20;
          transition: opacity 0.2s ease;
        }

        .scan2-auth-back-link:hover {
          opacity: 0.75;
        }

        .scan2-auth-container {
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: auto 0;
        }

        @media (max-width: 480px) {
          .scan2-auth-back-link {
            top: 16px;
            left: 16px;
          }
          .scan2-auth-layout-root {
            padding: 56px 12px 32px 12px;
          }
        }

        @keyframes orbPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}
