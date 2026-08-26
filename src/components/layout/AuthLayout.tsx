// src/components/layout/AuthLayout.tsx
// 100% Faithful Port of scan-2 AuthLayout — Pure Vanilla CSS (Zero Tailwind, 100vh No Scroll)

import { Outlet, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="scan2-auth-layout-root">
      {/* BACKGROUND AMBIENT ORBS */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      {/* MAIN CENTERED CONTAINER */}
      <div className="scan2-auth-container">
        {/* TOP BACK LINK — Positioned small directly above the Card */}
        <Link to="/" className="scan2-auth-back-link">
          <ArrowLeft size={14} />
          <span>KEMBALI</span>
        </Link>

        {/* CARD OUTLET */}
        <Outlet />
      </div>

      {/* PURE VANILLA CSS STYLING */}
      <style>{`
        .scan2-auth-layout-root {
          height: 100vh;
          width: 100%;
          background-color: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 16px;
          overflow: hidden;
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

        .scan2-auth-container {
          width: 100%;
          max-width: 400px;
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .scan2-auth-back-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          font-weight: 800;
          color: #0f6784;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-decoration: none;
          margin-bottom: 8px;
          margin-left: 4px;
          transition: opacity 0.2s ease;
        }

        .scan2-auth-back-link:hover {
          opacity: 0.75;
        }

        @media (max-height: 600px) {
          .scan2-auth-layout-root {
            height: auto;
            min-height: 100vh;
            overflow-y: auto;
            padding: 24px 16px;
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
