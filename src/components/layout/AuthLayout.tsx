// src/components/layout/AuthLayout.tsx
// 100% Faithful Port of Claude's Split-Frame Auth Layout — Pure Vanilla CSS

import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="claude-auth-root">
      <div className="frame">
        {/* LEFT — Brand Visual Panel */}
        <div className="visual">
          <div className="scan-field" />
          <svg className="rings" viewBox="0 0 340 340">
            <circle className="core" cx="230" cy="230" r="14" />
            <circle cx="230" cy="230" r="50" />
            <circle cx="230" cy="230" r="90" />
            <circle cx="230" cy="230" r="130" />
            <circle cx="230" cy="230" r="170" />
          </svg>
          <div className="visual-top">
            <div className="brand-mark">SKINCLUV</div>
          </div>
          <div>
            <p className="visual-quote">Kulit Anda punya <span>cerita</span>. Kami bantu membacanya.</p>
            <br />
            <p className="visual-caption">Konsultasi personal berbasis analisis AI, dirancang khusus untuk kondisi kulit Anda.</p>
          </div>
        </div>

        {/* RIGHT — Form Side */}
        <div className="form-side">
          <Outlet />
        </div>
      </div>

      {/* PURE VANILLA CSS STYLING FROM CLAUDE */}
      <style>{`
        :root {
          --teal-900: #0A3E48;
          --teal-800: #0B4F5C;
          --teal-700: #126575;
          --teal-100: #DCEEEA;
          --cream: #FAF7F1;
          --peach: #E8A87C;
          --peach-dark: #B96A3D;
          --ink: #1A2B2B;
          --ink-soft: #5C6B6B;
          --line: rgba(10, 62, 72, 0.12);
        }

        .claude-auth-root {
          font-family: 'Inter', sans-serif;
          background: var(--cream);
          color: var(--ink);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          box-sizing: border-box;
        }

        .frame {
          width: 100%;
          max-width: 960px;
          min-height: 600px;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 1fr;
          box-shadow: 0 24px 60px rgba(10, 62, 72, 0.12);
        }

        @media (max-width: 760px) {
          .frame {
            grid-template-columns: 1fr;
            max-width: 420px;
            min-height: auto;
          }
          .visual {
            display: none !important;
          }
        }

        /* LEFT — BRAND VISUAL PANEL */
        .visual {
          position: relative;
          background: var(--teal-800);
          color: #ffffff;
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }

        .scan-field {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
          background-size: 18px 18px;
          opacity: 0.5;
        }

        .rings {
          position: absolute;
          right: -60px;
          bottom: -60px;
          width: 340px;
          height: 340px;
          pointer-events: none;
        }

        .rings circle {
          fill: none;
          stroke: rgba(255, 255, 255, 0.18);
          stroke-width: 1;
        }

        .rings circle.core {
          fill: var(--peach);
          stroke: none;
          opacity: 0.9;
        }

        .visual-top {
          position: relative;
          z-index: 2;
        }

        .brand-mark {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.14em;
          color: var(--teal-100);
        }

        .visual-quote {
          position: relative;
          z-index: 2;
          font-family: 'Fraunces', serif;
          font-size: 28px;
          line-height: 1.35;
          font-weight: 500;
          max-width: 320px;
          margin: 0;
        }

        .visual-quote span {
          color: var(--peach);
        }

        .visual-caption {
          position: relative;
          z-index: 2;
          font-size: 14px;
          color: var(--teal-100);
          line-height: 1.6;
          max-width: 280px;
          margin: 0;
        }

        /* RIGHT — FORM SIDE */
        .form-side {
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-sizing: border-box;
        }

        @media (max-width: 480px) {
          .form-side {
            padding: 32px 24px;
          }
        }
      `}</style>
    </div>
  )
}
