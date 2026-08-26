// src/components/layout/AuthLayout.tsx
// 100% Full-Screen Edge-to-Edge & Mobile Stacked Responsive Auth Layout — Pure Vanilla CSS

import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="claude-auth-root">
      <div className="frame">
        {/* TOP / LEFT — Brand Visual Panel */}
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
          <div className="visual-body">
            <p className="visual-quote">Kulit Anda punya <span>cerita</span>. Kami bantu membacanya.</p>
            <br />
            <p className="visual-caption">Konsultasi personal berbasis analisis AI, dirancang khusus untuk kondisi kulit Anda.</p>
          </div>
        </div>

        {/* BOTTOM / RIGHT — Form Side Outlet */}
        <div className="form-side">
          <Outlet />
        </div>
      </div>

      {/* PURE VANILLA CSS STYLING */}
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
          background: #ffffff;
          color: var(--ink);
          min-height: 100vh;
          width: 100vw;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          box-sizing: border-box;
        }

        .frame {
          width: 100%;
          min-height: 100vh;
          margin: 0;
          padding: 0;
          border-radius: 0;
          background: #ffffff;
          overflow: hidden;
          display: grid;
          grid-template-columns: 5fr 7fr;
          box-shadow: none;
        }

        /* LEFT / TOP — BRAND VISUAL PANEL */
        .visual {
          position: relative;
          background: var(--teal-800);
          color: #ffffff;
          padding: 64px 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          width: 100%;
          min-height: 100vh;
          box-sizing: border-box;
        }

        .scan-field {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.6;
        }

        .rings {
          position: absolute;
          right: -40px;
          bottom: -40px;
          width: 380px;
          height: 380px;
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
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: var(--teal-100);
        }

        .visual-body {
          position: relative;
          z-index: 2;
        }

        .visual-quote {
          font-family: 'Fraunces', serif;
          font-size: 32px;
          line-height: 1.35;
          font-weight: 500;
          max-width: 380px;
          margin: 0;
        }

        .visual-quote span {
          color: var(--peach);
        }

        .visual-caption {
          font-size: 15px;
          color: var(--teal-100);
          line-height: 1.6;
          max-width: 340px;
          margin: 0;
        }

        /* RIGHT / BOTTOM — FORM SIDE */
        .form-side {
          padding: 64px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          width: 100%;
          min-height: 100vh;
          max-width: 520px;
          margin: 0 auto;
          box-sizing: border-box;
          background: #ffffff;
        }

        /* TABLET BREAKPOINT (768px - 1023px) */
        @media (max-width: 1023px) and (min-width: 768px) {
          .frame {
            grid-template-columns: 1fr 1fr;
          }
          .visual {
            padding: 48px 32px;
          }
          .form-side {
            padding: 48px 32px;
            max-width: 100%;
          }
          .visual-quote {
            font-size: 26px;
          }
        }

        /* MOBILE STACKED BREAKPOINT (< 768px) — Stack Visual Header on top, Form below */
        @media (max-width: 767px) {
          .claude-auth-root {
            min-height: 100vh;
            height: auto;
          }

          .frame {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .visual {
            display: flex !important;
            min-height: auto;
            padding: 40px 24px 36px 24px;
            justify-content: flex-start;
            gap: 28px;
          }

          .visual-quote {
            font-size: 24px;
            line-height: 1.3;
            max-width: 100%;
          }

          .visual-caption {
            font-size: 13.5px;
            max-width: 100%;
          }

          .rings {
            width: 260px;
            height: 260px;
            right: -40px;
            bottom: -40px;
          }

          .form-side {
            padding: 32px 24px 48px 24px;
            max-width: 100%;
            min-height: auto;
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  )
}
